const request = require('supertest');

jest.mock('../../server/models/userModel');
const userModel = require('../../server/models/userModel');
const tokenService = require('../../server/services/tokenService');
const app = require('../../server/app');

const regularUser = { id: 1, name: 'Regular', email: 'user@test.com', role: 'user', is_active: 1 };
const adminUser = { id: 2, name: 'Admin', email: 'admin@test.com', role: 'admin', is_active: 1 };

afterEach(() => jest.clearAllMocks());

describe('Admin routes — role-based authorization', () => {
  it('rejects a logged-in but non-admin user with 403', async () => {
    userModel.findById.mockResolvedValue(regularUser);
    const token = tokenService.signAccessToken(regularUser);

    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401 before even checking role', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('prevents an admin from deleting their own account', async () => {
    userModel.findById.mockResolvedValue(adminUser);
    const token = tokenService.signAccessToken(adminUser);

    const res = await request(app).delete(`/api/admin/users/${adminUser.id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(userModel.deleteById).not.toHaveBeenCalled();
  });
});
