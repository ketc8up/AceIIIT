import { PrismaClient } from '@prisma/client';
import { CommerceService } from '../src/services/commerce.service';
import crypto from 'crypto';
import { describeDb } from './db-guard';

const prisma = new PrismaClient();

describeDb('Commerce Service Acceptance Tests', () => {
  let user: any;
  let activeProduct: any;
  let inactiveProduct: any;
  let coupon: any;

  beforeAll(async () => {
    // Clean up
    await prisma.couponRedemption.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '9876543210',
        password: 'pass'
      }
    });

    activeProduct = await prisma.product.create({
      data: {
        code: 'TEST-1',
        name: 'Active Product',
        price: 1000,
        taxConfig: 18,
        status: 'ACTIVE'
      }
    });

    inactiveProduct = await prisma.product.create({
      data: {
        code: 'TEST-2',
        name: 'Inactive Product',
        price: 500,
        taxConfig: 18,
        status: 'INACTIVE'
      }
    });

    coupon = await prisma.coupon.create({
      data: {
        code: '10OFF',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Student cannot manipulate price - calculated server-side', async () => {
    const items = [{ productId: activeProduct.id, quantity: 1 }]; // No price submitted
    const order = await CommerceService.createOrder(user.id, items);
    
    expect(order.subtotal).toBe(1000);
    expect(order.tax).toBe(180);
    expect(order.total).toBe(1180);
  });

  it('2. Student cannot create an order for an inactive product', async () => {
    const items = [{ productId: inactiveProduct.id, quantity: 1 }];
    
    await expect(CommerceService.createOrder(user.id, items))
      .rejects.toThrow('Product Inactive Product is not active');
  });

  it('3. Invalid coupon is rejected', async () => {
    const items = [{ productId: activeProduct.id, quantity: 1 }];
    
    await expect(CommerceService.createOrder(user.id, items, 'FAKE_COUPON'))
      .rejects.toThrow('Invalid or inactive coupon');
  });

  it('4. Valid coupon is applied server-side', async () => {
    const items = [{ productId: activeProduct.id, quantity: 1 }];
    const order = await CommerceService.createOrder(user.id, items, '10OFF');
    
    expect(order.subtotal).toBe(1000);
    expect(order.discount).toBe(100);
    expect(order.tax).toBe(162); // 180 * 0.9
    expect(order.total).toBe(1000 - 100 + 162); // 1062
  });

  it('5. Historical order item price remains unchanged after product price changes', async () => {
    const items = [{ productId: activeProduct.id, quantity: 1 }];
    const order = await CommerceService.createOrder(user.id, items);
    
    // Change product price
    await prisma.product.update({
      where: { id: activeProduct.id },
      data: { price: 2000 }
    });

    // Check order item snapshot
    const item = await prisma.orderItem.findFirst({ where: { orderId: order.id } });
    expect(item?.unitPrice).toBe(1000); // Unchanged
    
    // Restore product price
    await prisma.product.update({
      where: { id: activeProduct.id },
      data: { price: 1000 }
    });
  });

  it('6. Duplicate payment submission is safely handled', async () => {
    const items = [{ productId: activeProduct.id, quantity: 1 }];
    const order = await CommerceService.createOrder(user.id, items);
    
    const idempotencyKey = crypto.randomUUID();
    
    const p1 = await CommerceService.submitPayment(user.id, order.id, 'UTR123', 'ref1', idempotencyKey);
    const p2 = await CommerceService.submitPayment(user.id, order.id, 'UTR123', 'ref1', idempotencyKey);
    
    expect(p1.id).toBe(p2.id); // Same payment returned, no duplicate created
  });

  it('7. Student cannot mark payment VERIFIED (Defaults to PENDING_VERIFICATION)', async () => {
    const items = [{ productId: activeProduct.id, quantity: 1 }];
    const order = await CommerceService.createOrder(user.id, items);
    
    const p1 = await CommerceService.submitPayment(user.id, order.id, 'UTR456', 'ref1', crypto.randomUUID());
    expect(p1.status).toBe('PENDING_VERIFICATION'); // Set exclusively by backend
  });
});
