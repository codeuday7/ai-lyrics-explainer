const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { detectLanguage, translateText } = require('./languageService');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Enhanced Multilingual Lyrics Prompt
 */
const getMultilingualPrompt = (lyrics, songName, artist, explanationLanguage = 'English') => {
  return `You are an expert music analyst and lyric interpreter.

The lyrics below may be written in any language.

INSTRUCTIONS:
Step 1: Detect the language of the lyrics.
Step 2: Translate the lyrics into English if necessary.
Step 3: Analyze the lyrics line-by-line for meaning.
Step 4: Provide the final explanation in ${explanationLanguage}.

Song: ${songName || 'Unknown'}
Artist: ${artist || 'Unknown'}

Return a VALID JSON object ONLY with no markdown fences, no extra text, just raw JSON:

{
  "detected_language": "language name (e.g., 'Telugu', 'Hindi', 'English')",
  "detected_language_code": "ISO 639-1 code (e.g., 'te', 'hi', 'en')",
  "translated_lyrics": "English translation if needed (if already English, put original lyrics)",
  "explanation_language": "${explanationLanguage}",
  "theme": "central idea of the song (1-2 sentences) IN ${explanationLanguage}",
  "emotionalTone": "overall emotion conveyed (1 sentence) IN ${explanationLanguage}",
  "line_by_line_explanation": [
    {
      "line": "original lyric line",
      "explanation": "meaning explanation IN ${explanationLanguage}"
    }
  ],
  "hiddenMeaning": "interpret metaphors, symbolism, deeper message (2-3 sentences) IN ${explanationLanguage}",
  "overallMessage": "core message the artist communicates (2-3 sentences) IN ${explanationLanguage}",
  "culturalContext": "historical era, cultural movement, real-world events (2 sentences) IN ${explanationLanguage}",
  "ahaInsight": "one mind-blowing fact that most casual listeners miss (1 punchy sentence) IN ${explanationLanguage}"
}

Rules:
- Be insightful and clear
- Interpret metaphors and storytelling
- Do NOT repeat lyrics verbatim
- Write explanations in engaging language
- line_by_line_explanation: analyze major lyrical sections (not every single line)
- Prefix each explanation with a bolded label like **[OPENING VERSE]**, **[CHORUS]**, **[BRIDGE]**
- For theme, hidden meaning, overall message: identify 2-3 impactful phrases and wrap in **bold**
- Keep formatting clean and optimize for human reading

Lyrics:
${lyrics}`;
};

/**
 * Clean Markdown Code Fences from JSON response
 */
const cleanJsonText = (text) => {
  return text.replace(/^```(json)?\s*/i, '').replace(/```\s*$/i, '').trim();
};

/**
 * Primary API: Google Gemini (gemini-1.5-flash)
 */
const callGemini = async (prompt) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  
  const cleaned = cleanJsonText(text);
  const parsed = JSON.parse(cleaned);
  return { provider: 'Gemini', ...parsed };
};

/**
 * Fallback API: OpenRouter (anthropic/claude-3-haiku)
 */
const callOpenRouter = async (prompt) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is missing from environment variables.');

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'LyricsAI Explainer'
      }
    }
  );

  const text = response.data.choices[0].message.content.trim();
  const cleaned = cleanJsonText(text);
  const parsed = JSON.parse(cleaned);
  return { provider: 'Claude (OpenRouter)', ...parsed };
};

/**
 * Main Analysis Orchestrator (Multilingual)
 */
const analyzeLyrics = async (lyrics, songName = '', artist = '', explanationLanguage = 'English') => {
  const prompt = getMultilingualPrompt(lyrics, songName, artist, explanationLanguage);

  try {
    // 1. Attempt Primary Provider (Gemini)
    console.log('[AI Service] Attempting Gemini API...');
    return await callGemini(prompt);
  } catch (geminiError) {
    console.warn('[AI Service] Gemini Failed:', geminiError.message);
    console.log('[AI Service] Falling back to OpenRouter (Claude-3-Haiku)...');

    try {
      // 2. Attempt Fallback Provider (OpenRouter)
      return await callOpenRouter(prompt);
    } catch (fallbackError) {
      console.error('[AI Service] OpenRouter Fallback Failed:', fallbackError.message);
      throw new Error('All AI providers failed. Please try again later.');
    }
  }
};

module.exports = { analyzeLyrics, getMultilingualPrompt };
