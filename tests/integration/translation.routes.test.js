const request = require('supertest');

jest.mock('../../server/models/userModel');
jest.mock('../../server/models/translationModel');
jest.mock('../../server/models/languageModel');
jest.mock('../../server/models/apiUsageModel');
jest.mock('../../server/services/translationService');

const userModel = require('../../server/models/userModel');
const translationModel = require('../../server/models/translationModel');
const languageModel = require('../../server/models/languageModel');
const translationService = require('../../server/services/translationService');
const tokenService = require('../../server/services/tokenService');
const app = require('../../server/app');

const activeUser = { id: 1, name: 'Test User', email: 'user@test.com', role: 'user', is_active: 1 };
const authHeader = () => `Bearer ${tokenService.signAccessToken(activeUser)}`;

beforeEach(() => {
  userModel.findById.mockResolvedValue(activeUser);
});
afterEach(() => jest.clearAllMocks());

describe('Translation routes — authentication guard', () => {
  it('rejects requests with no token', async () => {
    const res = await request(app).post('/api/translations').send({ text: 'Hello', targetLanguage: 'ha' });
    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid token', async () => {
    const res = await request(app)
      .post('/api/translations')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ text: 'Hello', targetLanguage: 'ha' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/translations — language scope validation', () => {
  it('rejects a target language outside the 4-language scope (e.g. French)', async () => {
    const res = await request(app)
      .post('/api/translations')
      .set('Authorization', authHeader())
      .send({ text: 'Hello', targetLanguage: 'fr' });

    expect(res.status).toBe(422);
    expect(translationService.translateText).not.toHaveBeenCalled();
  });

  it('rejects identical source and target languages', async () => {
    const res = await request(app)
      .post('/api/translations')
      .set('Authorization', authHeader())
      .send({ text: 'Hello', sourceLanguage: 'en', targetLanguage: 'en' });

    expect(res.status).toBe(422);
  });

  it('rejects empty text', async () => {
    const res = await request(app)
      .post('/api/translations')
      .set('Authorization', authHeader())
      .send({ text: '', targetLanguage: 'ha' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/translations — success path', () => {
  it('translates, persists history, and returns the record', async () => {
    translationService.translateText.mockResolvedValue({
      translatedText: 'Sannu',
      detectedSourceLanguage: 'en',
    });
    translationModel.create.mockResolvedValue({
      id: 99, user_id: 1, source_language: 'en', target_language: 'ha',
      original_text: 'Hello', translated_text: 'Sannu', is_favorite: 0,
    });

    const res = await request(app)
      .post('/api/translations')
      .set('Authorization', authHeader())
      .send({ text: 'Hello', sourceLanguage: 'auto', targetLanguage: 'ha' });

    expect(res.status).toBe(201);
    expect(res.body.data.translation.translated_text).toBe('Sannu');
    expect(translationService.translateText).toHaveBeenCalledWith('Hello', 'ha', 'auto');
  });

  it('propagates a clean 502 when the Google API call fails', async () => {
    const AppError = require('../../server/utils/AppError');
    translationService.translateText.mockRejectedValue(new AppError('Translation failed. Please try again.', 502));

    const res = await request(app)
      .post('/api/translations')
      .set('Authorization', authHeader())
      .send({ text: 'Hello', targetLanguage: 'ha' });

    expect(res.status).toBe(502);
    expect(translationModel.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/translations/languages', () => {
  it('returns only active languages', async () => {
    languageModel.findAllActive.mockResolvedValue([
      { id: 1, language_name: 'English', language_code: 'en' },
      { id: 2, language_name: 'Hausa', language_code: 'ha' },
    ]);

    const res = await request(app).get('/api/translations/languages').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.languages).toHaveLength(2);
  });
});
