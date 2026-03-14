const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Universal Lyrics Prompt
 */
const getPrompt = (lyrics, songName, artist) => {
  return `You are a professional music analyst and lyric interpreter.

Analyze the following song lyrics deeply.

Song: ${songName || 'Unknown'}
Artist: ${artist || 'Unknown'}

Return a VALID JSON object ONLY with no markdown fences, no extra text, just raw JSON with these fields:

{
  "theme": "central idea of the song (1-2 sentences)",
  "emotionalTone": "overall emotion conveyed (1 sentence)",
  "verseBreakdown": ["explanation of verse/section 1", "explanation of verse/section 2", "..."],
  "hiddenMeaning": "interpret metaphors, symbolism, or deeper message (2-3 sentences)",
  "overallMessage": "the core message the artist communicates (2-3 sentences)",
  "culturalContext": "historical era, cultural movement, or real-world events that influenced this song (2 sentences)",
  "ahaInsight": "one mind-blowing, highly shareable fact or psychological observation about the song that most casual listeners completely miss (1 punchy sentence)"
}

Rules:
- Be insightful and clear
- Interpret metaphors and storytelling
- Do NOT repeat lyrics verbatim
- Write explanations in simple, engaging English
- verseBreakdown must be an array of strings, one per major section. You MUST prefix every explanation in the array with a bolded structural label in brackets, like **[OPENING VERSE]**, **[CHORUS]**, or **[BRIDGE]**.
- Formatting Instruction: Whenever you generate the text for the 'Theme', 'Hidden Meaning', and 'Overall Message' sections, act as an expert copywriter. Identify the 2 to 3 most impactful phrases or core concepts within your response and wrap them in double asterisks to bold them in Markdown (e.g., **cultural pride**). Do not bold entire sentences, only the punchy, high-value keywords. Keep the formatting clean and optimize for human skimming.

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
      response_format: { type: 'json_object' } // Ensure JSON structure if supported
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
 * Main Analysis Orchestrator
 */
const analyzeLyrics = async (lyrics, songName = '', artist = '') => {
  const prompt = getPrompt(lyrics, songName, artist);

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

module.exports = { analyzeLyrics };
