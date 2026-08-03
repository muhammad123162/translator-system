const config = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { SUPPORTED_LANGUAGES } = require('../config/constants');

/**
 * The real Google client is only constructed when mock mode is off,
 * and only on first use (not at module load) — this means the app
 * can boot and be fully demoable even with no Google credentials
 * present at all, as long as USE_MOCK_TRANSLATION=true in .env.
 */
let client = null;
function getClient() {
  if (!client) {
    const { TranslationServiceClient } = require('@google-cloud/translate').v3;
    client = new TranslationServiceClient();
  }
  return client;
}
const parent = () => `projects/${config.google.projectId}/locations/global`;

/**
 * A small phrase dictionary so the mock mode demo looks convincing
 * for common greetings, rather than obviously fake gibberish. Keys
 * are lowercased English phrases; anything not found falls back to a
 * clearly-labeled mock string (see translateTextMock).
 */
const MOCK_PHRASES = {
  hello: { ha: 'Sannu', ig: 'Ndewo', yo: 'Bawo' },
  'welcome to the department of computer science': {
    ha: 'Barka da zuwa Sashen Kimiyyar Kwamfuta',
    ig: 'Nnọọ na ngalaba sayensị kọmputa',
    yo: 'Kaabo si Ẹka Kọmputa Saikíẹ̀nsì',
  },
  'thank you': { ha: 'Na gode', ig: 'Daalụ', yo: 'E se' },
  'how are you': { ha: 'Yaya kake', ig: 'Kedu ka ị mere', yo: 'Bawo ni' },
  'good morning': { ha: 'Barka da safiya', ig: 'Ụtụtụ ọma', yo: 'E kaaro' },
};

function translateTextMock(text, targetLanguageCode, sourceLanguageCode) {
  const key = text.trim().toLowerCase();
  const entry = MOCK_PHRASES[key];

  if (entry && entry[targetLanguageCode]) {
    return {
      translatedText: entry[targetLanguageCode],
      detectedSourceLanguage: sourceLanguageCode === 'auto' ? 'en' : sourceLanguageCode,
    };
  }

  // Clearly labeled so nobody mistakes this for a real translation
  // during a demo — the goal is to exercise the full app flow
  // (history, favorites, stats) while Google Cloud billing is pending.
  return {
    translatedText: `[MOCK ${targetLanguageCode.toUpperCase()} TRANSLATION] ${text}`,
    detectedSourceLanguage: sourceLanguageCode === 'auto' ? 'en' : sourceLanguageCode,
  };
}

/**
 * Translates text, optionally auto-detecting the source language.
 * Returns both the translation and the detected source language code
 * so the UI can display "Detected: Hausa" etc.
 *
 * @param {string} text
 * @param {string} targetLanguageCode  e.g. 'yo'
 * @param {string} [sourceLanguageCode] omit or pass 'auto' to auto-detect
 */
async function translateText(text, targetLanguageCode, sourceLanguageCode) {
  if (config.google.useMockTranslation) {
    logger.info('USE_MOCK_TRANSLATION is on — returning a simulated translation, not calling Google.');
    return translateTextMock(text, targetLanguageCode, sourceLanguageCode);
  }

  const request = {
    parent: parent(),
    contents: [text],
    mimeType: 'text/plain',
    targetLanguageCode,
    ...(sourceLanguageCode && sourceLanguageCode !== 'auto'
      ? { sourceLanguageCode }
      : {}),
  };

  try {
    const [response] = await getClient().translateText(request);
    const translation = response.translations[0];

    return {
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedLanguageCode || sourceLanguageCode || null,
    };
  } catch (err) {
    // Google's client throws rich gRPC errors — log the detail server-side,
    // but surface a clean, safe message to the client (no internals leaked).
    logger.error('Google Translation API error:', err.message);

    if (err.code === 3) {
      // INVALID_ARGUMENT — e.g. unsupported language code
      throw new AppError('Unsupported language or malformed request.', 400);
    }
    if (err.code === 8) {
      // RESOURCE_EXHAUSTED — Google-side quota hit
      throw new AppError('Translation service is temporarily over quota. Please try again shortly.', 503);
    }
    throw new AppError('Translation failed. Please try again.', 502);
  }
}

/**
 * Detects the language of a piece of text without translating it —
 * used by the "Auto Detect" toggle to show the user what was
 * detected before they commit to a target language.
 */
async function detectLanguage(text) {
  if (config.google.useMockTranslation) {
    return { languageCode: 'en', confidence: 0.99 };
  }

  try {
    const [response] = await getClient().detectLanguage({ parent: parent(), content: text });
    const best = response.languages.sort((a, b) => b.confidence - a.confidence)[0];
    return best ? { languageCode: best.languageCode, confidence: best.confidence } : null;
  } catch (err) {
    logger.error('Google language detection error:', err.message);
    throw new AppError('Language detection failed. Please try again.', 502);
  }
}

/**
 * Fetches Google's full supported-language list (used to keep the
 * `languages` lookup table in sync via an admin "refresh" action,
 * rather than hand-maintaining it forever).
 */
async function listSupportedLanguages(displayLanguageCode = 'en') {
  if (config.google.useMockTranslation) {
    return SUPPORTED_LANGUAGES.map((l) => ({ languageCode: l.code, displayName: l.name }));
  }

  try {
    const [response] = await getClient().getSupportedLanguages({ parent: parent(), displayLanguageCode });
    return response.languages.map((l) => ({
      languageCode: l.languageCode,
      displayName: l.displayName,
    }));
  } catch (err) {
    logger.error('Google list-languages error:', err.message);
    throw new AppError('Could not retrieve supported languages.', 502);
  }
}

module.exports = { translateText, detectLanguage, listSupportedLanguages };