/**
 * Phase 0 security regression tests. These run without any database: PrismaClient is
 * replaced by the in-memory fake in helpers/fake-prisma.ts.
 */
jest.mock('@prisma/client', () => {
  const { fakePrisma } = require('./helpers/fake-prisma');
  return { PrismaClient: jest.fn(() => fakePrisma) };
});

import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import app from '../src/app';
import { parseConfig } from '../src/config';
import { db, resetDb, addUser, addOrder } from './helpers/fake-prisma';

const API_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(API_ROOT, '..');
const SECRET = process.env.JWT_SECRET as string;

const sign = (payload: object, options: jwt.SignOptions = { expiresIn: '1h' }, secret = SECRET) =>
  jwt.sign(payload, secret, { algorithm: 'HS256', ...options });

beforeEach(() => resetDb());

// ---------------------------------------------------------------------------
// TEST 1-4: the project directory is not exposed by Express
// ---------------------------------------------------------------------------
describe('Static file exposure (TEST 1-4)', () => {
  const receiptsDir = path.join(REPO_ROOT, 'private_uploads', 'receipts');
  const receiptName = `security-test-${crypto.randomUUID()}.png`;
  const receiptMarker = `PRIVATE-RECEIPT-${crypto.randomUUID()}`;

  beforeAll(() => {
    fs.mkdirSync(receiptsDir, { recursive: true });
    fs.writeFileSync(path.join(receiptsDir, receiptName), receiptMarker);
  });

  afterAll(() => {
    fs.rmSync(path.join(receiptsDir, receiptName), { force: true });
  });

  const sensitive: [string, string][] = [
    ['/.env', 'DATABASE_URL'],
    ['/api/.env', 'DATABASE_URL'],
    ['/dev.db', 'SQLite format'],
    ['/api/prisma/dev.db', 'SQLite format'],
    ['/prisma/dev.db', 'SQLite format'],
    ['/api/prisma/schema.prisma', 'datasource'],
    ['/package.json', '"dependencies"'],
    ['/api/package.json', '"dependencies"'],
    ['/src/app.ts', 'express'],
    ['/api/src/app.ts', 'express'],
    ['/api/src/routes.ts', 'router'],
    ['/api/seed.js', 'PrismaClient'],
    ['/.certs/key.pem', 'PRIVATE KEY'],
    ['/fix.py', 'import'],
    ['/generate_pages.py', 'import'],
    ['/saas/PROMPT.md', '# PROMPT'],
    ['/docs/commerce-architecture.md', '# ACEIIIT'],
    ['/.gitignore', 'node_modules'],
    ['/css/%2e%2e/api/.env', 'DATABASE_URL'],
    ['/css/..%2fapi%2f.env', 'DATABASE_URL'],
    ['/js/%2e%2e/package.json', '"dependencies"'],
  ];

  it.each(sensitive)('GET %s is not served', async (url, marker) => {
    const res = await request(app).get(url);
    expect([400, 403, 404]).toContain(res.status);
    expect(res.text).not.toContain(marker);
  });

  it('TEST 3: private receipts are not reachable by path', async () => {
    for (const url of [
      `/private_uploads/receipts/${receiptName}`,
      `/api/private_uploads/receipts/${receiptName}`,
      `/receipts/${receiptName}`,
    ]) {
      const res = await request(app).get(url);
      expect([403, 404]).toContain(res.status);
      expect(res.text).not.toContain(receiptMarker);
    }
  });

  it('TEST 3: the receipt viewer still requires an admin token', async () => {
    const res = await request(app).get(`/api/admin/receipts/view?ref=receipts/${receiptName}`);
    expect(res.status).toBe(401);
    expect(res.text).not.toContain(receiptMarker);
  });

  it.each([
    ['/'],
    ['/index.html'],
    ['/checkout.html'],
    ['/checkout'],
    ['/admin'],
    ['/admin.html'],
    ['/dashboard.html'],
    ['/about.html'],
    ['/privacy.html'],
    ['/refund.html'],
    ['/terms.html'],
    ['/contact.html'],
    ['/css/design-system.css'],
    ['/js/checkout.js'],
    ['/js/course-box/app.js'],
    ['/saas/logo.js'],
  ])('public frontend file %s is still served', async (url) => {
    const res = await request(app).get(url);
    expect(res.status).toBe(200);
  });

  it('unknown API routes return JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});

// ---------------------------------------------------------------------------
// TEST 5: hardcoded admin credentials are gone
// ---------------------------------------------------------------------------
describe('Admin authentication (TEST 5)', () => {
  it('old hardcoded credentials do not authenticate, even if that admin user exists', async () => {
    addUser({ email: 'admin@gmail.com', role: 'ADMIN', password: 'admin-password' });
    const res = await request(app)
      .post('/api/auth/admin')
      .send({ email: 'admin@gmail.com', password: 'aDmin123' });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it('old hardcoded credentials do not create or promote an admin', async () => {
    const res = await request(app)
      .post('/api/auth/admin')
      .send({ email: 'admin@gmail.com', password: 'aDmin123' });
    expect(res.status).toBe(401);
    expect(db.users.find((u) => u.role === 'ADMIN')).toBeUndefined();
  });

  it('a plaintext (non-bcrypt) stored password never authenticates', async () => {
    addUser({ email: 'plain@example.com', role: 'ADMIN', password: 'admin-password' });
    const res = await request(app)
      .post('/api/auth/admin')
      .send({ email: 'plain@example.com', password: 'admin-password' });
    expect(res.status).toBe(401);
  });

  it('a student with a valid bcrypt password cannot use admin login', async () => {
    addUser({ email: 'student@example.com', role: 'STUDENT', password: bcrypt.hashSync('correct-horse-battery', 4) });
    const res = await request(app)
      .post('/api/auth/admin')
      .send({ email: 'student@example.com', password: 'correct-horse-battery' });
    expect(res.status).toBe(401);
  });

  it('login errors never leak stack traces', async () => {
    const res = await request(app).post('/api/auth/admin').send({ email: 'not-an-email' });
    expect(res.status).toBe(401);
    expect(res.body.stack).toBeUndefined();
  });

  it('source code contains no hardcoded credentials or fallback secrets', () => {
    const files = ['src/routes.ts', 'src/app.ts', 'src/middleware/auth.middleware.ts', 'src/services/commerce.service.ts'];
    for (const file of files) {
      const src = fs.readFileSync(path.join(API_ROOT, file), 'utf8');
      expect(src).not.toContain('aDmin123');
      expect(src).not.toContain('admin@gmail.com');
      expect(src).not.toContain('fallback-secret-key');
      expect(src).not.toMatch(/INTERNAL_API_SECRET\s*\|\|/);
      expect(src).not.toMatch(/JWT_SECRET\s*\|\|/);
    }
  });
});

// ---------------------------------------------------------------------------
// TEST 6: guest authentication cannot escalate to admin
// ---------------------------------------------------------------------------
describe('Guest authentication (TEST 6)', () => {
  it('guest login with an admin email is refused', async () => {
    addUser({ email: 'boss@example.com', role: 'ADMIN', password: bcrypt.hashSync('a-long-admin-password', 4) });
    const res = await request(app).post('/api/auth/guest').send({ email: 'boss@example.com' });
    expect(res.status).toBe(403);
    expect(res.body.token).toBeUndefined();
  });

  it('guest token has guest scope, no role, and an expiry', async () => {
    const res = await request(app).post('/api/auth/guest').send({ email: 'new@example.com', firstName: 'New' });
    expect(res.status).toBe(200);
    const decoded = jwt.decode(res.body.token) as jwt.JwtPayload;
    expect(decoded.scope).toBe('guest');
    expect(decoded.role).toBeUndefined();
    expect(typeof decoded.exp).toBe('number');
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.role).toBeUndefined();
  });

  it('a role in the guest payload is ignored', async () => {
    const res = await request(app)
      .post('/api/auth/guest')
      .send({ email: 'sneaky@example.com', role: 'ADMIN' });
    expect(res.status).toBe(200);
    expect(db.users.find((u) => u.email === 'sneaky@example.com')!.role).toBe('STUDENT');

    const admin = await request(app).get('/api/admin/payments').set('Authorization', `Bearer ${res.body.token}`);
    expect(admin.status).toBe(403);
  });

  it('a guest-scoped token is refused on admin routes even for an ADMIN user', async () => {
    const admin = addUser({ email: 'boss2@example.com', role: 'ADMIN' });
    const token = sign({ userId: admin.id, scope: 'guest' });
    for (const [method, url] of [
      ['get', '/api/admin/payments'],
      ['get', '/api/admin/users'],
      ['get', '/api/admin/audit-logs'],
      ['post', '/api/admin/payments/x/verify'],
    ] as const) {
      const res = await (request(app) as any)[method](url).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    }
  });

  it('an admin-scoped token for a STUDENT user is refused on admin routes', async () => {
    const student = addUser({ email: 'stu@example.com', role: 'STUDENT' });
    const token = sign({ userId: student.id, scope: 'admin' });
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('a role claim inside the token is not trusted', async () => {
    const student = addUser({ email: 'stu2@example.com', role: 'STUDENT' });
    const token = sign({ userId: student.id, scope: 'admin', role: 'ADMIN' });
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('guest login requires a valid email', async () => {
    const res = await request(app).post('/api/auth/guest').send({});
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// TEST 7-8: token validation
// ---------------------------------------------------------------------------
describe('JWT validation (TEST 7-8)', () => {
  let userId: string;
  beforeEach(() => {
    userId = addUser({ email: 'jwt@example.com' }).id;
    addOrder(userId);
  });

  const call = (token: string) =>
    request(app).get(`/api/orders/${db.orders[0].id}`).set('Authorization', `Bearer ${token}`);

  it('TEST 7: a token without expiration is rejected', async () => {
    const token = jwt.sign({ userId, scope: 'guest' }, SECRET, { algorithm: 'HS256' });
    expect((await call(token)).status).toBe(401);
  });

  it('TEST 8: an expired token is rejected', async () => {
    const token = sign({ userId, scope: 'guest', exp: Math.floor(Date.now() / 1000) - 60 }, {});
    expect((await call(token)).status).toBe(401);
  });

  it('a malformed token is rejected', async () => {
    expect((await call('not.a.jwt')).status).toBe(401);
    expect((await call('garbage')).status).toBe(401);
  });

  it('a token signed with another secret (e.g. the old fallback) is rejected', async () => {
    const token = sign({ userId, scope: 'guest' }, { expiresIn: '1h' }, 'fallback-secret-key');
    expect((await call(token)).status).toBe(401);
  });

  it('an unsigned (alg: none) token is rejected', async () => {
    const token = jwt.sign({ userId, scope: 'guest', exp: Math.floor(Date.now() / 1000) + 3600 }, '', {
      algorithm: 'none',
    } as any);
    expect((await call(token)).status).toBe(401);
  });

  it('a token without a scope (old format) is rejected', async () => {
    const token = sign({ userId });
    expect((await call(token)).status).toBe(401);
  });

  it('a missing token is rejected', async () => {
    const res = await request(app).get(`/api/orders/${db.orders[0].id}`);
    expect(res.status).toBe(401);
  });

  it('a valid token for a deleted user is rejected', async () => {
    const token = sign({ userId: crypto.randomUUID(), scope: 'guest' });
    expect((await call(token)).status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// TEST 9: startup requires a strong JWT_SECRET
// ---------------------------------------------------------------------------
describe('Configuration (TEST 9)', () => {
  const good = {
    JWT_SECRET: crypto.randomBytes(48).toString('base64url'),
    INTERNAL_API_SECRET: crypto.randomBytes(32).toString('base64url'),
  };

  it('accepts strong secrets and defaults the expiry to 1h', () => {
    const cfg = parseConfig(good);
    expect(cfg.JWT_EXPIRES_IN).toBe('1h');
  });

  it.each([
    ['missing', { ...good, JWT_SECRET: undefined }],
    ['empty', { ...good, JWT_SECRET: '' }],
    ['too short', { ...good, JWT_SECRET: 'short-but-unique-value-1' }],
    ['the old fallback', { ...good, JWT_SECRET: 'fallback-secret-key' }],
    ['the .env.example placeholder', { ...good, JWT_SECRET: '<strong-random-production-secret>' }],
    ['a repeated character', { ...good, JWT_SECRET: 'a'.repeat(64) }],
  ])('rejects a JWT_SECRET that is %s, without echoing the value', (_label, env) => {
    expect(() => parseConfig(env)).toThrow(/JWT_SECRET/);
    try {
      parseConfig(env);
    } catch (e: any) {
      if (env.JWT_SECRET) expect(e.message).not.toContain(env.JWT_SECRET);
    }
  });

  it('rejects a missing INTERNAL_API_SECRET', () => {
    expect(() => parseConfig({ ...good, INTERNAL_API_SECRET: undefined })).toThrow(/INTERNAL_API_SECRET/);
  });

  it('the real server process refuses to start without JWT_SECRET', () => {
    const result = spawnSync(path.join(API_ROOT, 'node_modules', '.bin', 'tsx'), ['src/server.ts'], {
      cwd: API_ROOT,
      env: { ...process.env, JWT_SECRET: '', PORT: '0' },
      encoding: 'utf8',
      timeout: 30000,
    });
    expect(result.status).not.toBe(0);
    expect(result.status).not.toBeNull(); // exited on its own, did not keep listening
    expect(result.stderr).toContain('JWT_SECRET');
    expect(result.stdout).not.toContain('listening');
  }, 60000);

  it('the real server process refuses a weak JWT_SECRET and does not log it', () => {
    const weak = 'weak-unique-marker-7f3a';
    const result = spawnSync(path.join(API_ROOT, 'node_modules', '.bin', 'tsx'), ['src/server.ts'], {
      cwd: API_ROOT,
      env: { ...process.env, JWT_SECRET: weak, PORT: '0' },
      encoding: 'utf8',
      timeout: 30000,
    });
    expect(result.status).not.toBe(0);
    expect(result.status).not.toBeNull();
    expect(result.stderr + result.stdout).not.toContain(weak);
  }, 60000);
});

// ---------------------------------------------------------------------------
// TEST 10: legitimate student access still works
// ---------------------------------------------------------------------------
describe('Student access (TEST 10)', () => {
  it('guest login → own order → payment works; other users\' orders are refused', async () => {
    const login = await request(app).post('/api/auth/guest').send({ email: 'buyer@example.com', firstName: 'Buy' });
    expect(login.status).toBe(200);
    const token = login.body.token;
    const me = db.users.find((u) => u.email === 'buyer@example.com')!;

    const mine = addOrder(me.id);
    const other = addOrder(addUser({ email: 'victim@example.com' }).id);

    const own = await request(app).get(`/api/orders/${mine.id}`).set('Authorization', `Bearer ${token}`);
    expect(own.status).toBe(200);
    expect(own.body.id).toBe(mine.id);

    const foreign = await request(app).get(`/api/orders/${other.id}`).set('Authorization', `Bearer ${token}`);
    expect(foreign.status).toBe(403);

    const payOther = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: other.id, utr: '111122223333', idempotencyKey: crypto.randomUUID() });
    expect(payOther.status).toBe(400);
    expect(db.payments).toHaveLength(0);

    const payOwn = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: mine.id, utr: '444455556666', receiptReference: 'receipts/x.png', idempotencyKey: 'key-1' });
    expect(payOwn.status).toBe(201);
    expect(payOwn.body.status).toBe('PENDING_VERIFICATION');
  });

  it('a reused idempotency key never returns another user\'s payment', async () => {
    const victim = addUser({ email: 'victim2@example.com' });
    const victimOrder = addOrder(victim.id);
    db.payments.push({
      id: 'victim-payment',
      orderId: victimOrder.id,
      idempotencyKey: 'shared-key',
      utr: '999988887777',
      status: 'PENDING_VERIFICATION',
    });

    const attacker = addUser({ email: 'attacker@example.com' });
    const attackerOrder = addOrder(attacker.id);
    const token = sign({ userId: attacker.id, scope: 'guest' });

    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: attackerOrder.id, idempotencyKey: 'shared-key' });
    expect(res.status).toBe(400);
    expect(res.text).not.toContain('victim-payment');
  });

  it('public product listing still works without a token', async () => {
    db.products.push({ id: 'mock', code: 'mock', name: 'Paid Mock Series', price: 599, status: 'ACTIVE' });
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// TEST 11: legitimate admin access still works
// ---------------------------------------------------------------------------
describe('Admin access (TEST 11)', () => {
  const password = 'a-strong-admin-password';
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    addUser({ email: 'ops@example.com', role: 'ADMIN', password: bcrypt.hashSync(password, 4) });
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
  });

  afterEach(() => fetchSpy.mockRestore());

  const login = async () => {
    const res = await request(app).post('/api/auth/admin').send({ email: 'ops@example.com', password });
    expect(res.status).toBe(200);
    return res.body.token as string;
  };

  it('admin logs in with a bcrypt password and gets an expiring admin-scoped token', async () => {
    const token = await login();
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.scope).toBe('admin');
    expect(typeof decoded.exp).toBe('number');
    expect(decoded.exp! - decoded.iat!).toBe(3600);
  });

  it('wrong password is rejected', async () => {
    const res = await request(app).post('/api/auth/admin').send({ email: 'ops@example.com', password: 'nope-nope-nope' });
    expect(res.status).toBe(401);
  });

  it('admin can list payments, users and audit logs without password hashes leaking', async () => {
    const token = await login();
    const student = addUser({ email: 'payer@example.com', password: bcrypt.hashSync('student-secret-pw', 4) });
    const order = addOrder(student.id);
    db.payments.push({ id: 'p1', orderId: order.id, status: 'PENDING_VERIFICATION', utr: '123412341234' });
    db.auditLogs.push({ id: 'l1', actorId: db.users[0].id, action: 'APPROVE_PAYMENT' });

    for (const url of ['/api/admin/payments', '/api/admin/users', '/api/admin/audit-logs']) {
      const res = await request(app).get(url).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.text).not.toContain('"password"');
      expect(res.text).not.toContain('$2b$');
    }
  });

  it('admin can verify a payment; provisioning still calls the Mock Portal with the configured secret', async () => {
    const token = await login();
    const student = addUser({ email: 'learner@example.com' });
    const order = addOrder(student.id);
    db.payments.push({ id: 'p2', orderId: order.id, status: 'PENDING_VERIFICATION', utr: '555566667777' });

    const res = await request(app).post('/api/admin/payments/p2/verify').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('VERIFIED');
    expect(db.orders[0].status).toBe('PAID');

    // provisioning runs in the background; wait for it to settle
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:4000/api/internal/access/provision',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-internal-api-secret': process.env.INTERNAL_API_SECRET }),
      })
    );
    expect(db.entitlements[0].provisioningStatus).toBe('PROVISIONED');
  });

  it('admin can reject a payment', async () => {
    const token = await login();
    const order = addOrder(addUser({ email: 'r@example.com' }).id);
    db.payments.push({ id: 'p3', orderId: order.id, status: 'PENDING_VERIFICATION', utr: '000011112222' });

    const res = await request(app)
      .post('/api/admin/payments/p3/reject')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'UTR does not match' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJECTED');
  });

  it('admin can retry failed provisioning', async () => {
    const token = await login();
    const student = addUser({ email: 'retry@example.com' });
    const order = addOrder(student.id);
    db.entitlements.push({
      id: 'e1',
      userId: student.id,
      orderId: order.id,
      resourceCode: 'PAID_MOCK_SERIES',
      status: 'ACTIVE',
      provisioningStatus: 'PROVISIONING_FAILED',
    });

    const res = await request(app).post('/api/admin/entitlements/e1/retry').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 50));
    expect(db.entitlements[0].provisioningStatus).toBe('PROVISIONED');
  });
});
