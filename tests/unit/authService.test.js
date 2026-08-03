const bcrypt = require('bcrypt');

jest.mock('../../server/models/userModel');
const userModel = require('../../server/models/userModel');
const authService = require('../../server/services/authService');

describe('authService.register', () => {
  afterEach(() => jest.clearAllMocks());

  it('throws 409 if the email is already registered', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'existing@test.com' });

    await expect(
      authService.register({ name: 'Test User', email: 'existing@test.com', password: 'password1' })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('hashes the password before storing it (never plain text)', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    userModel.create.mockImplementation(async ({ passwordHash }) => ({
      id: 1,
      name: 'Test User',
      email: 'new@test.com',
      role: 'user',
      password: passwordHash,
    }));

    await authService.register({ name: 'Test User', email: 'new@test.com', password: 'password1' });

    const [[createArgs]] = userModel.create.mock.calls;
    expect(createArgs.passwordHash).not.toBe('password1');
    expect(await bcrypt.compare('password1', createArgs.passwordHash)).toBe(true);
  });

  it('returns access and refresh tokens on successful registration', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ id: 1, name: 'Test User', email: 'new@test.com', role: 'user' });

    const result = await authService.register({ name: 'Test User', email: 'new@test.com', password: 'password1' });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(typeof result.accessToken).toBe('string');
  });
});

describe('authService.login', () => {
  afterEach(() => jest.clearAllMocks());

  it('throws 401 with a generic message when the email does not exist', async () => {
    userModel.findByEmail.mockResolvedValue(null);

    await expect(authService.login({ email: 'nobody@test.com', password: 'whatever1' })).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password.',
    });
  });

  it('throws 401 with the SAME generic message when the password is wrong (no user enumeration)', async () => {
    const hash = await bcrypt.hash('correct-password1', 4);
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'user@test.com', password: hash, is_active: 1, role: 'user' });

    await expect(authService.login({ email: 'user@test.com', password: 'wrong-password' })).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password.',
    });
  });

  it('throws 403 if the account has been deactivated', async () => {
    const hash = await bcrypt.hash('password1', 4);
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'user@test.com', password: hash, is_active: 0, role: 'user' });

    await expect(authService.login({ email: 'user@test.com', password: 'password1' })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('succeeds and returns tokens with a matching password + active account', async () => {
    const hash = await bcrypt.hash('password1', 4);
    userModel.findByEmail.mockResolvedValue({
      id: 1, name: 'User', email: 'user@test.com', password: hash, is_active: 1, role: 'user',
    });

    const result = await authService.login({ email: 'user@test.com', password: 'password1' });

    expect(result.user.password).toBeUndefined(); // never leak the hash to callers
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });
});
