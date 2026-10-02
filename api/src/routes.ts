import { Router, Request } from 'express';
import { CommerceService } from './services/commerce.service';
import { authenticateToken, requireAdmin, signAccessToken, AuthRequest } from './middleware/auth.middleware';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { EmailService } from './services/email.service';
import { createClient } from '@supabase/supabase-js';

const otpCache = new Map<string, { code: string, expiresAt: number }>();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseUrlValid = supabaseUrl.startsWith('http');
const supabase = supabaseUrlValid ? createClient(supabaseUrl, supabaseKey) : null;

const prisma = new PrismaClient();
const router = Router();

// User fields that are safe to return to clients (never the password hash).
const safeUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  college: true,
  year: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

// Used to keep admin-login timing constant when the account does not exist.
const DUMMY_BCRYPT_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 12);
// Configure multer to use memory storage for Supabase upload
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

router.post('/receipts/upload', authenticateToken, (req: AuthRequest, res) => {
  upload.single('receipt')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase storage is not configured' });
    }
    
    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const uuid = crypto.randomUUID();
      const internalPath = `receipts/${uuid}${ext}`;

      const { data, error } = await supabase
        .storage
        .from('private_uploads')
        .upload(internalPath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        throw error;
      }

      res.json({ receiptReference: internalPath });
    } catch (uploadError: any) {
      console.error('Supabase upload error:', uploadError);
      res.status(500).json({ error: 'Failed to upload file to storage' });
    }
  });
});

router.post('/orders', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { items, couponCode } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const order = await CommerceService.createOrder(req.user.id, items, couponCode);
    res.status(201).json(order);
  } catch (error: any) {
    // Only send safe error messages to client
    const safeError = error.message || 'An error occurred during order creation';
    res.status(400).json({ error: safeError });
  }
});

router.post('/payments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { orderId, utr, receiptReference, idempotencyKey, receiptPdfBase64 } = req.body;

    if (!orderId || !idempotencyKey) {
      return res.status(400).json({ error: 'orderId and idempotencyKey are required' });
    }

    // Validate receipt path
    if (receiptReference && !receiptReference.startsWith('receipts/')) {
       return res.status(400).json({ error: 'Invalid receipt reference' });
    }
    if (receiptReference && receiptReference.includes('..')) {
       return res.status(400).json({ error: 'Invalid receipt reference format' });
    }

    const payment = await CommerceService.submitPayment(req.user.id, orderId, utr, receiptReference, idempotencyKey, receiptPdfBase64);
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'An error occurred during payment submission' });
  }
});

router.get('/orders/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id as string }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Unauthorized user cannot access another user's order
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to access this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin endpoints

router.get('/admin/receipts/view', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { ref } = req.query;
    if (!ref || typeof ref !== 'string' || !ref.startsWith('receipts/') || ref.includes('..')) {
      return res.status(400).json({ error: 'Invalid receipt reference' });
    }
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase storage is not configured' });
    }
    
    const { data, error } = await supabase.storage.from('private_uploads').download(ref);
    
    if (error || !data) {
      return res.status(404).send('File not found');
    }
    
    // Most secure: send the file directly over the authenticated connection
    // The frontend must fetch this with Bearer token header and convert to Blob
    const buffer = await data.arrayBuffer();
    res.setHeader('Content-Type', data.type || 'application/octet-stream');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/admin/payments', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { order: { include: { user: { select: safeUserSelect } } } }
    });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.get('/admin/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: safeUserSelect
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.post('/admin/users/:id/delete', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.deletedAt) return res.status(400).json({ error: 'User is already deleted' });

    // Append a timestamp to the email to free up the original email
    const deletedEmail = `${user.email}_deleted_${Date.now()}`;
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date(), email: deletedEmail }
    });
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.post('/admin/users/:id/restore', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.deletedAt) return res.status(400).json({ error: 'User is not deleted' });

    // Try to strip the deleted suffix to restore original email
    const originalEmail = user.email.split('_deleted_')[0];
    
    // Check if the original email is already taken by someone else now
    const existing = await prisma.user.findUnique({ where: { email: originalEmail } });
    if (existing) {
      return res.status(400).json({ error: 'Cannot restore: another active registration is now using this email.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: null, email: originalEmail }
    });
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.get('/admin/audit-logs', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actor: { select: safeUserSelect } }
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.post('/admin/payments/:id/verify', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const updatedPayment = await CommerceService.verifyPayment(req.params.id as string, req.user.id);
    res.json(updatedPayment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.post('/admin/payments/:id/reject', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });

    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id as string },
      include: { order: { include: { user: true } } }
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'REJECTED') {
      return res.status(400).json({ error: 'Payment is already rejected' });
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      // If we are revoking a previously verified payment, undo the provisioning
      if (payment.status === 'VERIFIED') {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'PENDING' }
        });
        
        await tx.entitlement.deleteMany({
          where: { orderId: payment.orderId }
        });
        
        await tx.courseEnrollment.deleteMany({
          where: { orderId: payment.orderId }
        });
      }

      const p = await tx.payment.update({
        where: { id: req.params.id as string },
        data: {
          status: 'REJECTED',
          verifiedBy: req.user.id,
          verifiedAt: new Date(),
          rejectionReason: reason
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          paymentId: p.id,
          orderId: p.orderId,
          action: payment.status === 'VERIFIED' ? 'REVOKE_PAYMENT' : 'REJECT_PAYMENT',
          previousState: payment.status,
          newState: 'REJECTED',
          rejectionReason: reason
        }
      });

      return p;
    });

    EmailService.sendPaymentRejectedEmail(payment.order.user.email, payment.order.user.firstName, payment.order.orderNumber, reason).catch(console.error);

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/admin/payments/:id/cancel', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id as string }
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: req.params.id as string },
        data: { status: 'CANCELLED' }
      });
      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          paymentId: p.id,
          orderId: p.orderId,
          action: 'CANCEL_PAYMENT',
          previousState: payment.status,
          newState: 'CANCELLED'
        }
      });
      return p;
    });

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/admin/payments/:id/restore', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id as string }
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: req.params.id as string },
        data: { status: 'PENDING_VERIFICATION' }
      });
      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          paymentId: p.id,
          orderId: p.orderId,
          action: 'RESTORE_PAYMENT',
          previousState: payment.status,
          newState: 'PENDING_VERIFICATION'
        }
      });
      return p;
    });

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/admin/entitlements/:id/retry', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const entitlement = await prisma.entitlement.findUnique({
      where: { id: req.params.id as string }
    });

    if (!entitlement) return res.status(404).json({ error: 'Entitlement not found' });
    if (entitlement.provisioningStatus !== 'PROVISIONING_FAILED') {
      return res.status(400).json({ error: 'Only failed provisionings can be retried' });
    }

    // Set to PENDING and retry
    await prisma.entitlement.update({
      where: { id: entitlement.id },
      data: { provisioningStatus: 'PENDING_PROVISIONING' }
    });

    CommerceService.provisionEntitlements(entitlement.orderId).catch(console.error);

    res.json({ success: true, message: 'Retry initiated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
const guestSchema = z.object({
  email: z.string().trim().pipe(z.email().max(254)),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  college: z.string().trim().max(200).optional(),
  year: z.string().trim().max(20).optional(),
  otp: z.string().length(6)
});

router.post('/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await prisma.otp.upsert({
      where: { email: email.toLowerCase() },
      update: { code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      create: { email: email.toLowerCase(), code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }
    });
  } catch (dbErr: any) {
    console.error("Prisma OTP error:", dbErr);
    return res.status(500).json({ error: 'Database error: ' + (dbErr.message || 'unknown') });
  }

  try {
    await EmailService.sendOtpEmail(email, code);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Guest checkout login. Issues a short-lived token with scope "guest" only;
// guest tokens can never pass requireAdmin. Unknown body fields (e.g. "role") are dropped.
router.post('/auth/guest', async (req, res) => {
  const parsed = guestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid email and 6-digit OTP are required' });
  }
  const { firstName, lastName, email, phone, college, year, otp } = parsed.data;

  let cached;
  try {
    cached = await prisma.otp.findUnique({ where: { email: email.toLowerCase() } });
  } catch (dbErr: any) {
    return res.status(500).json({ error: 'Database read error: ' + (dbErr.message || 'unknown') });
  }
  
  if (!cached || cached.code !== otp || Date.now() > cached.expiresAt.getTime()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  
  try {
    await prisma.otp.delete({ where: { email: email.toLowerCase() } });
  } catch (e) {
    // ignore
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (user && user.role === 'ADMIN') {
      return res.status(403).json({ error: 'This account cannot use guest checkout' });
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: firstName || 'Guest',
          lastName: lastName || 'User',
          email,
          phone: phone || '',
          college: college || '',
          year: year || '',
          role: 'STUDENT',
          password: 'dummy-password' // Guests have no password login; this never matches a bcrypt hash
        }
      });
    }
    const token = signAccessToken(user.id, 'guest');
    res.json({
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const adminLoginSchema = z.object({
  email: z.email().max(254).transform((e) => e.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

// Admin login. Admin accounts are created only with `npm run admin:create`,
// which stores a bcrypt hash. Nothing here can create or promote an admin.
router.post('/auth/admin', async (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const hasHash = !!user && user.role === 'ADMIN' && /^\$2[aby]\$/.test(user.password);
    const passwordOk = await bcrypt.compare(password, hasHash ? user!.password : DUMMY_BCRYPT_HASH);

    if (!user || !hasHash || !passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signAccessToken(user.id, 'admin');
    res.json({
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: safeUserSelect
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/me/orders', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { items: true, payments: true }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/me/entitlements', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const entitlements = await prisma.entitlement.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(entitlements);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/products', async (req, res) => {
  const products = await prisma.product.findMany({ where: { status: 'ACTIVE' } });
  res.json(products);
});

export default router;
