const { TranslationServiceClient } = require('@google-cloud/translate').v3;
const config = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * The v3 client authenticates automatically via
 * GOOGLE_APPLICATION_CREDENTIALS (a service-account JSON key path),
 * so no key material ever appears in source code — it's supplied
 * entirely through the environment, per the "Secure API
 * authentication" requirement.
 */
const client = new TranslationServiceClient();
const parent = `projects/${config.google.projectId}/locations/global`;

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
  const request = {
    parent,
    contents: [text],
    mimeType: 'text/plain',
    targetLanguageCode,
    ...(sourceLanguageCode && sourceLanguageCode !== 'auto'
      ? { sourceLanguageCode }
      : {}),
  };

  try {
    const [response] = await client.translateText(request);
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
  try {
    const [response] = await client.detectLanguage({ parent, content: text });
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
  try {
    const [response] = await client.getSupportedLanguages({ parent, displayLanguageCode });
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
