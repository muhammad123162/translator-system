const tokenService = require('../../server/services/tokenService');

describe('tokenService', () => {
  const user = { id: 42, role: 'user' };

  it('signs an access token that verifies back to the same payload', () => {
    const token = tokenService.signAccessToken(user);
    const payload = tokenService.verifyAccessToken(token);
    expect(payload.id).toBe(42);
    expect(payload.role).toBe('user');
  });

  it('signs a refresh token that verifies back to the same user id', () => {
    const token = tokenService.signRefreshToken(user);
    const payload = tokenService.verifyRefreshToken(token);
    expect(payload.id).toBe(42);
  });

  it('rejects an access token when verified with the refresh secret', () => {
    const token = tokenService.signAccessToken(user);
    expect(() => tokenService.verifyRefreshToken(token)).toThrow();
  });

  it('rejects a tampered token', () => {
    const token = tokenService.signAccessToken(user);
    const tampered = token.slice(0, -2) + 'xx';
    expect(() => tokenService.verifyAccessToken(tampered)).toThrow();
  });
});
