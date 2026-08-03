const request = require('supertest');

jest.mock('../../server/models/userModel');
const userModel = require('../../server/models/userModel');
const app = require('../../server/app');

describe('POST /api/auth/register', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 422 when the payload is invalid (missing fields)', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('returns 422 when the password has no number', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'valid@test.com', password: 'nonumberhere' });
    expect(res.status).toBe(422);
  });

  it('returns 201 and a user object (without password) on success', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    userModel.create.mockResolvedValue({
      id: 1, name: 'Test User', email: 'new@test.com', role: 'user', password: 'hashed',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'new@test.com', password: 'password1' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('new@test.com');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns 409 when the email is already registered', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'existing@test.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'existing@test.com', password: 'password1' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 401 for a non-existent email', async () => {
    userModel.findByEmail.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'password1' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
