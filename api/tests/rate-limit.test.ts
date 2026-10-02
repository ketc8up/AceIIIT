/**
 * Brute-force protection on /api/auth/*. Uses a low limit so the test is fast;
 * production defaults to 10 requests per minute per IP.
 */
jest.mock('@prisma/client', () => {
  const { fakePrisma } = require('./helpers/fake-prisma');
  return { PrismaClient: jest.fn(() => fakePrisma) };
});

process.env.AUTH_RATE_LIMIT_PER_MIN = '3';

import request from 'supertest';

describe('Auth rate limiting', () => {
  it('blocks repeated admin login attempts with 429', async () => {
    // Required after the env change above so the app picks up the low limit.
    const app = require('../src/app').default;
    const attempt = () => request(app).post('/api/auth/admin').send({ email: 'x@example.com', password: 'guess' });

    for (let i = 0; i < 3; i++) {
      expect((await attempt()).status).toBe(401);
    }
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
  }, 30000);
});
