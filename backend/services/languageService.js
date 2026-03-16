/**
 * Language Service - Handles language detection and translation
 * Uses Gemini API for intelligent language operations
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Comprehensive language list with ISO 639-1 codes
 */
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'el', name: 'Greek' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'et', name: 'Estonian' },
  { code: 'ga', name: 'Irish' },
  { code: 'is', name: 'Icelandic' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
];

/**
 * Detect the language of lyrics text
 * Returns language code and language name
 */
const detectLanguage = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Analyze the following text and identify its language. Return ONLY a JSON object with no markdown fences:

{
  "detected_code": "ISO 639-1 language code (e.g., 'en', 'hi', 'te', 'es')",
  "detected_language": "Full language name"
}

Text to analyze:
${text.substring(0, 500)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Clean JSON if wrapped in markdown
    const cleanedText = responseText.replace(/^```(json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    return {
      detected_language: parsed.detected_language || 'Unknown',
      detected_code: parsed.detected_code || 'unknown',
    };
  } catch (error) {
    console.error('[Language Service] Detection failed:', error.message);
    return {
      detected_language: 'Unknown',
      detected_code: 'unknown',
    };
  }
};

/**
 * Translate text from one language to another
 * Returns translated text
 */
const translateText = async (text, targetLanguage) => {
  try {
    // If target is English and text might already be English, skip
    if (targetLanguage.toLowerCase() === 'english') {
      return text; // Return as-is; AI will translate if needed
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Translate the following lyrics into ${targetLanguage}. Keep the poetic structure and meaning intact.

Return ONLY the translated lyrics with no additional text or markdown.

Original lyrics:
${text}`;

    const result = await model.generateContent(prompt);
    const translatedText = result.response.text().trim();
    
    return translatedText;
  } catch (error) {
    console.error('[Language Service] Translation failed:', error.message);
    return text; // Return original if translation fails
  }
};

/**
 * Get list of all supported languages
 */
const getSupportedLanguages = () => {
  return SUPPORTED_LANGUAGES;
};

/**
 * Validate if a language code is supported
 */
const isLanguageSupported = (code) => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};

module.exports = {
  detectLanguage,
  translateText,
  getSupportedLanguages,
  isLanguageSupported,
};
