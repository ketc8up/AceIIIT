import { PrismaClient } from '@prisma/client';
import { CommerceService } from '../src/services/commerce.service';
import request from 'supertest';
import app from '../src/app';
import path from 'path';
import fs from 'fs';
import { signAccessToken } from '../src/middleware/auth.middleware';
import { describeDb } from './db-guard';

const prisma = new PrismaClient();

describeDb('E2E Commerce & Admin flow', () => {
  let userToken: string;
  let adminToken: string;
  let user: any;
  let admin: any;
  let product: any;

  beforeAll(async () => {
    // Clean DB
    await prisma.auditLog.deleteMany();
    await prisma.studentIdentity.deleteMany();
    await prisma.courseEnrollment.deleteMany();
    await prisma.entitlement.deleteMany();
    await prisma.couponRedemption.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Student',
        email: 'student@example.com',
        phone: '123',
        password: 'pass',
        role: 'STUDENT'
      }
    });

    admin = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        phone: '456',
        password: 'pass',
        role: 'ADMIN'
      }
    });

    product = await prisma.product.create({
      data: {
        code: 'TEST-MOCK-1',
        name: 'Paid Mock Series',
        price: 1000,
        taxConfig: 0,
        status: 'ACTIVE'
      }
    });

    userToken = signAccessToken(user.id, 'guest');
    adminToken = signAccessToken(admin.id, 'admin');

    // Create a dummy file for upload test
    fs.writeFileSync(path.join(__dirname, 'dummy.png'), 'dummy image content');
  });

  afterAll(async () => {
    if (fs.existsSync(path.join(__dirname, 'dummy.png'))) {
      fs.unlinkSync(path.join(__dirname, 'dummy.png'));
    }
    await prisma.$disconnect();
  });

  let receiptRef: string;
  let orderId: string;
  let paymentId: string;

  it('1. Uploads receipt securely and returns internal reference', async () => {
    const res = await request(app)
      .post('/api/receipts/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('receipt', path.join(__dirname, 'dummy.png'));

    expect(res.status).toBe(200);
    expect(res.body.receiptReference).toMatch(/^receipts\/[a-f0-9\-]+\.png$/);
    receiptRef = res.body.receiptReference;
  });

  it('2. Creates order and payment', async () => {
    const order = await CommerceService.createOrder(user.id, [{ productId: product.id, quantity: 1 }]);
    orderId = order.id;

    const payment = await CommerceService.submitPayment(user.id, orderId, 'UTR111', receiptRef, 'idemp-1');
    paymentId = payment.id;
    
    expect(payment.status).toBe('PENDING_VERIFICATION');
  });

  it('3. Admin can request signed URL for receipt', async () => {
    const res = await request(app)
      .get(`/api/admin/receipts/view?ref=${receiptRef}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.url).toContain('/api/admin/receipts/download?token=');
  });

  it('4. Admin verifies payment -> provisions access', async () => {
    const res = await request(app)
      .post(`/api/admin/payments/${paymentId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('VERIFIED');

    // Wait a brief moment for async provisioning
    await new Promise(r => setTimeout(r, 100));

    // Check entitlements
    const entitlements = await prisma.entitlement.findMany({ where: { orderId } });
    expect(entitlements.length).toBe(1);
    expect(entitlements[0].provisioningStatus).toBe('PROVISIONED');

    // Check identity link
    const idLink = await prisma.studentIdentity.findFirst({ where: { commerceUserId: user.id } });
    expect(idLink?.mockUserId).toBe('MOCK-student@example.com');
  });

  it('5. Audit log is created', async () => {
    const logs = await prisma.auditLog.findMany({ where: { paymentId } });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('APPROVE_PAYMENT');
    expect(logs[0].actorId).toBe(admin.id);
  });
});
