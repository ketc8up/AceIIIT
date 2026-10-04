import { PrismaClient } from '@prisma/client';
import type { Coupon } from '@prisma/client';
import crypto from 'crypto';
import { config } from '../config';
import mongoose from 'mongoose';
import { EmailService } from './email.service';

const prisma = new PrismaClient();

const mockUserSchema = new mongoose.Schema({
  email: String,
  name: String,
  isPaid: Boolean,
  status: String,
  isActivated: Boolean,
  emailVerified: Boolean,
  role: String
}, { strict: false });

const MockUser = mongoose.models.User || mongoose.model('User', mockUserSchema);

export class CommerceService {
  
  static async createOrder(userId: string, items: { productId: string; quantity: number }[], couponCode?: string) {
    if (!items || items.length === 0) throw new Error('Order must contain at least one item');
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new Error('Quantity must be a positive integer');
      }
    }
    // 1. Retrieve products from DB
    const productIds = items.map(i => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    let subtotal = 0;
    let tax = 0;
    
    const orderItemsData: any[] = [];

    // 2. Verify product availability & 3. Calculate prices/tax
    for (const item of items) {
      const product = dbProducts.find(p => p.id === item.productId);
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      if (product.status !== 'ACTIVE') {
        throw new Error(`Product ${product.name} is not active`);
      }

      const lineSubtotal = product.price * item.quantity;
      const lineTax = Math.round((lineSubtotal * product.taxConfig) / 100);
      
      subtotal += lineSubtotal;
      tax += lineTax;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        taxSnapshot: product.taxConfig,
        discountSnapshot: 0, // Simplified: discounts applied at order level here
        lineTotal: lineSubtotal + lineTax
      });
    }

    let discount = 0;
    let appliedCoupon: Coupon | null = null;

    // 4. Validate coupon & calculate discount
    if (couponCode) {
      appliedCoupon = await prisma.coupon.findUnique({
        where: { code: couponCode }
      });

      if (!appliedCoupon || appliedCoupon.status !== 'ACTIVE') {
        throw new Error('Invalid or inactive coupon');
      }

      // Check usage limits
      if (appliedCoupon.usageLimit !== null) {
        const redemptionCount = await prisma.couponRedemption.count({
          where: { couponId: appliedCoupon.id }
        });
        if (redemptionCount >= appliedCoupon.usageLimit) {
          throw new Error('Coupon usage limit reached');
        }
      }

      let eligibleSubtotal = subtotal;

      // Check product restriction
      const restriction = appliedCoupon.productRestriction;
      if (restriction) {
        const restrictedItems = items.filter(i => i.productId === restriction);
        if (restrictedItems.length === 0) {
          throw new Error('Coupon is not valid for the selected products');
        }
        
        eligibleSubtotal = 0;
        for (const item of restrictedItems) {
          const product = dbProducts.find(p => p.id === item.productId);
          if (product) {
            eligibleSubtotal += product.price * item.quantity;
          }
        }
      }

      // Check dates
      const now = new Date();
      if (appliedCoupon.startDate && now < appliedCoupon.startDate) {
        throw new Error('Coupon is not yet active');
      }
      if (appliedCoupon.endDate && now > appliedCoupon.endDate) {
        throw new Error('Coupon has expired');
      }

      // Calculate discount
      if (appliedCoupon.discountType === 'PERCENTAGE') {
        discount = Math.round((eligibleSubtotal * appliedCoupon.discountValue) / 100);
      } else if (appliedCoupon.discountType === 'FLAT') {
        discount = Math.min(appliedCoupon.discountValue, eligibleSubtotal);
      }
    }

    // Adjust tax if discount is applied before tax (assuming discount applies to subtotal before tax for simplicity, but let's recalculate tax proportionally)
    const discountRatio = subtotal > 0 ? (subtotal - discount) / subtotal : 1;
    tax = Math.round(tax * discountRatio);

    // 5. Calculate final total
    const total = subtotal - discount + tax;

    // 6. Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: `ACE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
          userId,
          subtotal,
          discount,
          tax,
          total,
          status: 'PENDING',
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      });

      // Record coupon redemption
      if (appliedCoupon) {
        try {
          await tx.couponRedemption.create({
            data: {
              couponId: appliedCoupon.id,
              userId,
              orderId: newOrder.id
            }
          });
        } catch (e: any) {
          if (e.code === 'P2002') {
             throw new Error('Coupon already redeemed by this user for this order');
          }
          throw e;
        }
      }

      return newOrder;
    });

    return order;
  }

  static async submitPayment(userId: string, orderId: string, utr: string, receiptReference: string, idempotencyKey: string, receiptPdfBase64?: string) {
    // Prevent duplicate payments via idempotency key
    const existingPayment = await prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { order: { select: { userId: true } } }
    });

    if (existingPayment) {
      // Never hand back another user's payment through a reused key
      if (existingPayment.order.userId !== userId) {
        throw new Error('Order not found');
      }
      const { order: _order, ...payment } = existingPayment;
      return payment;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    // Students may only pay for their own orders
    if (!order || order.userId !== userId) {
      throw new Error('Order not found');
    }

    if (order.status === 'PAID') {
      throw new Error('Order is already paid');
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Check for UTR uniqueness inside transaction
      if (utr) {
        const utrExists = await tx.payment.findUnique({
          where: { utr }
        });
        if (utrExists) {
          throw new Error('Payment with this UTR already submitted');
        }
      }

      return await tx.payment.create({
        data: {
          orderId,
          paymentMethod: 'MANUAL_UPI',
          status: 'PENDING_VERIFICATION',
          utr,
          amount: order.total,
          currency: order.currency,
          receiptReference,
          idempotencyKey
        }
      });
    });

    await EmailService.sendOrderPendingEmail(order.user.email, order.user.firstName, order.orderNumber, payment.amount, receiptPdfBase64).catch(console.error);

    return payment;
  }

  static async verifyPayment(paymentId: string, adminId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { items: true, user: true } } }
    });

    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'VERIFIED') throw new Error('Payment is already verified');

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'VERIFIED', verifiedBy: adminId, verifiedAt: new Date() }
      });
      
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' }
      });

      // Generate entitlements based on order items
      for (const item of payment.order.items) {
        // Read resourceCode from product metadata
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        let resourceCode = 'DEFAULT_ACCESS';
        if (product && product.metadata) {
          try {
            const meta = JSON.parse(product.metadata);
            if (meta.resourceCode) {
              resourceCode = meta.resourceCode;
            } else if (meta.mockResourceCode) {
              resourceCode = meta.mockResourceCode;
            }
          } catch (e) {
            console.error('Failed to parse product metadata for resourceCode', e);
          }
        }

        await tx.entitlement.create({
          data: {
            userId: payment.order.userId,
            orderId: payment.orderId,
            resourceCode: resourceCode,
            status: 'ACTIVE',
            provisioningStatus: 'PENDING_PROVISIONING'
          }
        });
        
        await tx.courseEnrollment.create({
          data: {
            userId: payment.order.userId,
            orderId: payment.orderId,
            courseCode: item.productName
          }
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          paymentId: p.id,
          orderId: p.orderId,
          action: 'APPROVE_PAYMENT',
          previousState: payment.status,
          newState: 'VERIFIED'
        }
      });

      return p;
    });

    // Fire provisioning (await to prevent serverless termination)
    await this.provisionEntitlements(updatedPayment.orderId).catch(console.error);

    const hasMock = payment.order.items.some(item => item.productId === 'mock');
    await EmailService.sendPaymentVerifiedEmail(payment.order.user.email, payment.order.user.firstName, payment.order.orderNumber, hasMock).catch(console.error);

    return updatedPayment;
  }

  static async provisionEntitlements(orderId: string) {
    const entitlements = await prisma.entitlement.findMany({
      where: { orderId, provisioningStatus: 'PENDING_PROVISIONING' },
      include: { user: true }
    });

    for (const ent of entitlements) {
      if (ent.resourceCode === 'PAID_MOCK_SERIES') {
        try {
          if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
          if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
          }

          // Directly Upsert into Mock Portal MongoDB
          const mockUser = await MockUser.findOneAndUpdate(
            { email: ent.user.email },
            { 
              $set: {
                name: `${ent.user.firstName} ${ent.user.lastName}`.trim(),
                email: ent.user.email,
                isPaid: true,
                status: 'active',
                isActivated: true,
                emailVerified: true
              },
              $setOnInsert: {
                role: 'student'
              }
            },
            { upsert: true, new: true }
          );

          // Link identity if not exists
          let identity = await prisma.studentIdentity.findFirst({
            where: { commerceUserId: ent.userId }
          });

          if (!identity) {
            identity = await prisma.studentIdentity.create({
              data: {
                commerceUserId: ent.userId,
                mockUserId: mockUser._id.toString(),
                email: ent.user.email
              }
            });
          }

          await prisma.entitlement.update({
            where: { id: ent.id },
            data: { provisioningStatus: 'PROVISIONED' }
          });
          
        } catch (error) {
          console.error(`Provisioning failed for entitlement ${ent.id}:`, error);
          await prisma.entitlement.update({
            where: { id: ent.id },
            data: { provisioningStatus: 'PROVISIONING_FAILED' }
          });
        }
      }
    }
  }
}
