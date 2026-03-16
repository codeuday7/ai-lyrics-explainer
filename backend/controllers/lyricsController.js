const Explanation = require('../models/Explanation');
const { analyzeLyrics } = require('../services/aiService');
const { getSupportedLanguages, isLanguageSupported } = require('../services/languageService');

// @desc  Analyze lyrics via Gemini AI (Multilingual)
// @route POST /api/lyrics/analyze
// @access Protected
const analyze = async (req, res) => {
  try {
    const { lyrics, songName, artist, explanationLanguage = 'English' } = req.body;

    if (!lyrics || lyrics.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lyrics with at least 20 characters.',
      });
    }

    const { provider, ...analysisData } = await analyzeLyrics(
      lyrics.trim(),
      songName,
      artist,
      explanationLanguage
    );

    res.status(200).json({
      success: true,
      message: 'Analysis complete!',
      provider: provider || 'unknown',
      data: {
        songName: songName || 'Unknown',
        artist: artist || 'Unknown Artist',
        ...analysisData,
      },
    });
  } catch (error) {
    console.error('Analyze error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze lyrics. Please try again.',
    });
  }
};

// @desc  Save explanation to MongoDB (Multilingual)
// @route POST /api/lyrics/save
// @access Protected
const saveExplanation = async (req, res) => {
  try {
    const {
      lyrics,
      songName,
      artist,
      theme,
      emotionalTone,
      verseBreakdown,
      hiddenMeaning,
      overallMessage,
      isPublic,
      // Multilingual fields
      detectedLanguage,
      detectedLanguageCode,
      translatedLyrics,
      explanationLanguage,
      explanationLanguageCode,
      lineByLineExplanation,
    } = req.body;

    if (!lyrics || !songName || !theme || !emotionalTone || !hiddenMeaning || !overallMessage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Please analyze the lyrics first.',
      });
    }

    const explanation = await Explanation.create({
      userId: req.user._id,
      songName,
      artist: artist || 'Unknown Artist',
      lyrics,
      theme,
      emotionalTone,
      verseBreakdown: Array.isArray(verseBreakdown) ? verseBreakdown : [verseBreakdown],
      hiddenMeaning,
      overallMessage,
      isPublic: isPublic !== undefined ? isPublic : true,
      // Multilingual fields
      originalLyrics: lyrics,
      detectedLanguage: detectedLanguage || 'Unknown',
      detectedLanguageCode: detectedLanguageCode || 'unknown',
      translatedLyrics: translatedLyrics || null,
      explanationLanguage: explanationLanguage || 'English',
      explanationLanguageCode: explanationLanguageCode || 'en',
      lineByLineExplanation: lineByLineExplanation || [],
    });

    res.status(201).json({
      success: true,
      message: 'Explanation saved successfully!',
      data: explanation,
    });
  } catch (error) {
    console.error('Save error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save explanation.',
    });
  }
};

// @desc  Get supported languages for explanation
// @route GET /api/lyrics/languages
// @access Public
const getLanguages = async (req, res) => {
  try {
    const languages = getSupportedLanguages();
    res.status(200).json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('Languages error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load languages.',
    });
  }
};

// @desc  Get public feed (latest explanations)
// @route GET /api/lyrics/feed
// @access Public
const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const explanations = await Explanation.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-lyrics -userId -__v');

    const total = await Explanation.countDocuments({ isPublic: true });

    res.status(200).json({
      success: true,
      data: explanations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Feed error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load feed.' });
  }
};

// @desc  Search explanations by song name
// @route GET /api/lyrics/search?song=
// @access Public
const searchExplanations = async (req, res) => {
  try {
    const { song } = req.query;

    if (!song || song.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a song name to search.' });
    }

    const results = await Explanation.find({
      isPublic: true,
      $or: [
        { songName: { $regex: song.trim(), $options: 'i' } },
        { artist: { $regex: song.trim(), $options: 'i' } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-lyrics -userId -__v');

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
};

// @desc  Get user's saved explanations
// @route GET /api/lyrics/my-explanations
// @access Protected
const getMyExplanations = async (req, res) => {
  try {
    const explanations = await Explanation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-lyrics -__v');

    res.status(200).json({ success: true, data: explanations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch your explanations.' });
  }
};

module.exports = { analyze, saveExplanation, getFeed, searchExplanations, getMyExplanations, getLanguages };
