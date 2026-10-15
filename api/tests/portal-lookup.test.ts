/**
 * Mock Portal lookups: the portal's admin "Details" window reads a student's orders, payments
 * and payment screenshot through these server-to-server routes. They need the shared
 * INTERNAL_API_SECRET, return only what the window shows, and serve a screenshot only for a
 * payment on that student's own order. No database: PrismaClient is the in-memory fake.
 */
jest.mock('@prisma/client', () => {
  const { fakePrisma } = require('./helpers/fake-prisma');
  return { PrismaClient: jest.fn(() => fakePrisma) };
});

jest.mock('../src/services/email.service', () => ({
  EmailService: {
    sendOrderPendingEmail: jest.fn(async () => {}),
    sendPaymentVerifiedEmail: jest.fn(async () => {}),
    sendPaymentRejectedEmail: jest.fn(async () => {}),
    sendOtpEmail: jest.fn(async () => {}),
  },
}));

import request from 'supertest';
import app from '../src/app';
import { db, resetDb, addUser, addOrder } from './helpers/fake-prisma';

const SECRET = process.env.INTERNAL_API_SECRET as string;

function seedCustomer(email = 'riya@example.com') {
  const user = addUser({ email, firstName: 'Riya', lastName: 'Sharma', phone: '9999999999', college: 'IIIT', year: '12' });
  const order = addOrder(user.id, 1180);
  order.status = 'PAID'; // addOrder also adds its line item ("Paid Mock Series")
  db.payments.push({
    id: 'pay-1', orderId: order.id, paymentMethod: 'MANUAL_UPI', status: 'VERIFIED', utr: '123456789012', amount: 1180, currency: 'INR',
    receiptReference: 'receipts/abc.png', verifiedBy: 'admin', verifiedAt: new Date(), rejectionReason: null, idempotencyKey: 'k1', createdAt: new Date(), updatedAt: new Date(),
  });
  db.entitlements.push({ id: 'ent-1', userId: user.id, orderId: order.id, resourceCode: 'CLASS_NOTES', status: 'ACTIVE', provisioningStatus: 'PROVISIONED', createdAt: new Date(), updatedAt: new Date() });
  return { user, order };
}

beforeEach(() => resetDb());

describe('GET /api/internal/portal/customer', () => {
  test('needs the shared secret', async () => {
    seedCustomer();
    expect((await request(app).get('/api/internal/portal/customer?email=riya@example.com')).status).toBe(401);
    const wrong = await request(app).get('/api/internal/portal/customer?email=riya@example.com').set('x-internal-api-secret', 'not-the-secret');
    expect(wrong.status).toBe(401);
  });

  test('returns orders, items and payments for that email, without internal fields', async () => {
    seedCustomer();
    const res = await request(app).get('/api/internal/portal/customer?email=Riya@Example.com').set('x-internal-api-secret', SECRET);
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.found).toBe(true);
    expect(res.body.customer).toMatchObject({ name: 'Riya Sharma', phone: '9999999999', college: 'IIIT' });
    expect(res.body.orders).toHaveLength(1);
    const [order] = res.body.orders;
    expect(order).toMatchObject({ status: 'PAID', total: 1180, currency: 'INR' });
    expect(order.items).toEqual([{ productName: 'Paid Mock Series', quantity: 1, unitPrice: 1000, lineTotal: 1180 }]);
    expect(order.payments[0]).toMatchObject({ id: 'pay-1', method: 'MANUAL_UPI', status: 'VERIFIED', utr: '123456789012', amount: 1180, hasReceipt: true, receiptType: 'png' });
    expect(res.body.entitlements).toEqual([expect.objectContaining({ resourceCode: 'CLASS_NOTES', status: 'ACTIVE' })]);
    const text = JSON.stringify(res.body);
    expect(text).not.toMatch(/receipts\/abc\.png|dummy-password|idempotencyKey|verifiedBy/);
  });

  test('an unknown email is not an error; a bad email is', async () => {
    const unknown = await request(app).get('/api/internal/portal/customer?email=nobody@example.com').set('x-internal-api-secret', SECRET);
    expect(unknown.body).toEqual({ found: false, orders: [] });
    const bad = await request(app).get('/api/internal/portal/customer?email=not-an-email').set('x-internal-api-secret', SECRET);
    expect(bad.status).toBe(400);
  });
});

describe('GET /api/internal/portal/payments/:id/receipt', () => {
  test("needs the secret and only serves that student's own payment", async () => {
    seedCustomer();
    addUser({ email: 'other@example.com' });
    expect((await request(app).get('/api/internal/portal/payments/pay-1/receipt?email=riya@example.com')).status).toBe(401);
    const other = await request(app).get('/api/internal/portal/payments/pay-1/receipt?email=other@example.com').set('x-internal-api-secret', SECRET);
    expect(other.status).toBe(404);
    // Storage is unconfigured in tests, so the owner gets 503 (never the file from elsewhere).
    const owner = await request(app).get('/api/internal/portal/payments/pay-1/receipt?email=riya@example.com').set('x-internal-api-secret', SECRET);
    expect(owner.status).toBe(503);
  });
});
