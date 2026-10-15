/**
 * Minimal in-memory stand-in for PrismaClient, covering only the calls made by the
 * routes exercised in the security tests. It lets those tests run without any database.
 */
import crypto from 'crypto';

type Row = Record<string, any>;

export const db = {
  users: [] as Row[],
  orders: [] as Row[],
  orderItems: [] as Row[],
  payments: [] as Row[],
  auditLogs: [] as Row[],
  entitlements: [] as Row[],
  enrollments: [] as Row[],
  identities: [] as Row[],
  products: [] as Row[],
  otps: [] as Row[],
  coupons: [] as Row[],
  redemptions: [] as Row[],
};

export function resetDb() {
  for (const key of Object.keys(db) as (keyof typeof db)[]) db[key] = [];
}

const now = () => new Date();
const id = () => crypto.randomUUID();

function project(row: Row | undefined | null, select?: Row): Row | null {
  if (!row) return null;
  if (!select) return { ...row };
  const out: Row = {};
  for (const [key, on] of Object.entries(select)) if (on) out[key] = row[key];
  return out;
}

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([k, v]) => {
    if (v && typeof v === 'object' && 'in' in v) return (v.in as any[]).includes(row[k]);
    if (v && typeof v === 'object' && 'not' in v) return row[k] !== v.not;
    return row[k] === v;
  });
}

function withUser(userId: string, include: any) {
  const user = db.users.find((u) => u.id === userId);
  return include === true ? { ...user } : project(user, include?.select);
}

function paymentWithIncludes(p: Row, include?: Row) {
  if (!include) return { ...p };
  const out: Row = { ...p };
  if (include.order) {
    const order = db.orders.find((o) => o.id === p.orderId)!;
    if (include.order === true) out.order = { ...order };
    else if (include.order.select) out.order = project(order, include.order.select);
    else {
      out.order = { ...order };
      if (include.order.include?.user) out.order.user = withUser(order.userId, include.order.include.user);
      if (include.order.include?.items) out.order.items = db.orderItems.filter((i) => i.orderId === order.id);
    }
  }
  return out;
}

export const fakePrisma: any = {
  user: {
    findUnique: async ({ where }: any) => {
      const u = db.users.find((r) => matches(r, where));
      return u ? { ...u } : null;
    },
    findMany: async ({ select }: any = {}) => db.users.map((u) => project(u, select)),
    create: async ({ data }: any) => {
      const row = { id: id(), role: 'STUDENT', createdAt: now(), updatedAt: now(), ...data };
      db.users.push(row);
      return { ...row };
    },
    update: async ({ where, data }: any) => {
      const u = db.users.find((r) => matches(r, where))!;
      Object.assign(u, data, { updatedAt: now() });
      return { ...u };
    },
  },
  // Email OTPs for guest checkout (one row per email).
  otp: {
    findUnique: async ({ where }: any) => {
      const o = db.otps.find((r) => matches(r, where));
      return o ? { ...o } : null;
    },
    upsert: async ({ where, update, create }: any) => {
      const o = db.otps.find((r) => matches(r, where));
      if (o) {
        Object.assign(o, update);
        return { ...o };
      }
      const row = { id: id(), ...create };
      db.otps.push(row);
      return { ...row };
    },
    delete: async ({ where }: any) => {
      const i = db.otps.findIndex((r) => matches(r, where));
      if (i === -1) throw new Error('Record to delete does not exist.');
      return db.otps.splice(i, 1)[0];
    },
  },
  product: {
    findMany: async ({ where }: any = {}) => db.products.filter((p) => matches(p, where)),
    findUnique: async ({ where }: any) => {
      const p = db.products.find((r) => matches(r, where));
      return p ? { ...p } : null;
    },
  },
  order: {
    findMany: async ({ where, include }: any = {}) =>
      db.orders
        .filter((o) => matches(o, where))
        .map((o) => ({
          ...o,
          ...(include?.items ? { items: db.orderItems.filter((i) => i.orderId === o.id) } : {}),
          ...(include?.payments ? { payments: db.payments.filter((p) => p.orderId === o.id) } : {}),
        })),
    findUnique: async ({ where, include }: any) => {
      const o = db.orders.find((r) => matches(r, where));
      if (!o) return null;
      const out: Row = { ...o };
      if (include?.user) out.user = withUser(o.userId, include.user);
      if (include?.items) out.items = db.orderItems.filter((i) => i.orderId === o.id);
      return out;
    },
    update: async ({ where, data }: any) => {
      const o = db.orders.find((r) => matches(r, where))!;
      Object.assign(o, data);
      return { ...o };
    },
    updateMany: async ({ where, data }: any) => {
      const rows = db.orders.filter((r) => matches(r, where));
      rows.forEach((r) => Object.assign(r, data));
      return { count: rows.length };
    },
  },
  payment: {
    findUnique: async ({ where, include }: any) => {
      const p = db.payments.find((r) => matches(r, where));
      return p ? paymentWithIncludes(p, include) : null;
    },
    findMany: async ({ include }: any = {}) => db.payments.map((p) => paymentWithIncludes(p, include)),
    create: async ({ data }: any) => {
      const row = { id: id(), createdAt: now(), updatedAt: now(), verifiedBy: null, ...data };
      db.payments.push(row);
      return { ...row };
    },
    update: async ({ where, data }: any) => {
      const p = db.payments.find((r) => matches(r, where))!;
      Object.assign(p, data);
      return { ...p };
    },
    updateMany: async ({ where, data }: any) => {
      const rows = db.payments.filter((r) => matches(r, where));
      rows.forEach((r) => Object.assign(r, data));
      return { count: rows.length };
    },
  },
  auditLog: {
    findMany: async ({ include }: any = {}) =>
      db.auditLogs.map((l) => (include?.actor ? { ...l, actor: withUser(l.actorId, include.actor) } : { ...l })),
    create: async ({ data }: any) => {
      const row = { id: id(), createdAt: now(), ...data };
      db.auditLogs.push(row);
      return row;
    },
  },
  entitlement: {
    create: async ({ data }: any) => {
      const row = { id: id(), createdAt: now(), ...data };
      db.entitlements.push(row);
      return row;
    },
    findMany: async ({ where, include }: any = {}) =>
      db.entitlements
        .filter((e) => matches(e, where))
        .map((e) => (include?.user ? { ...e, user: withUser(e.userId, true) } : { ...e })),
    findUnique: async ({ where }: any) => db.entitlements.find((e) => matches(e, where)) ?? null,
    findFirst: async ({ where }: any) => db.entitlements.find((e) => matches(e, where)) ?? null,
    update: async ({ where, data }: any) => {
      const e = db.entitlements.find((r) => matches(r, where))!;
      Object.assign(e, data);
      return { ...e };
    },
    deleteMany: async ({ where }: any) => {
      db.entitlements = db.entitlements.filter((e) => !matches(e, where));
      return { count: 0 };
    },
  },
  courseEnrollment: {
    create: async ({ data }: any) => {
      const row = { id: id(), ...data };
      db.enrollments.push(row);
      return row;
    },
    deleteMany: async ({ where }: any) => {
      db.enrollments = db.enrollments.filter((e) => !matches(e, where));
      return { count: 0 };
    },
  },
  studentIdentity: {
    findFirst: async ({ where }: any) => db.identities.find((i) => matches(i, where)) ?? null,
    create: async ({ data }: any) => {
      const row = { id: id(), ...data };
      db.identities.push(row);
      return row;
    },
  },
  coupon: {
    findMany: async () => db.coupons.map((c) => ({ ...c })),
    findUnique: async ({ where }: any) => {
      const c = db.coupons.find((r) => matches(r, where));
      return c ? { ...c } : null;
    },
    create: async ({ data }: any) => {
      if (db.coupons.some((c) => c.code === data.code)) {
        throw Object.assign(new Error('Unique constraint failed on the fields: (`code`)'), { code: 'P2002' });
      }
      const row = { id: id(), createdAt: now(), usageLimit: null, ...data };
      db.coupons.push(row);
      return { ...row };
    },
    update: async ({ where, data }: any) => {
      const c = db.coupons.find((r) => matches(r, where))!;
      Object.assign(c, data);
      return { ...c };
    },
    delete: async ({ where }: any) => {
      const i = db.coupons.findIndex((r) => matches(r, where));
      if (i === -1) throw Object.assign(new Error('Record to delete does not exist.'), { code: 'P2025' });
      return db.coupons.splice(i, 1)[0];
    },
  },
  couponRedemption: {
    count: async ({ where }: any = {}) => db.redemptions.filter((r) => matches(r, where)).length,
  },
  $transaction: async (fn: (tx: any) => any) => fn(fakePrisma),
  $disconnect: async () => {},
};

export function addUser(data: Partial<Row> & { email: string }): Row {
  const row = {
    id: id(),
    firstName: 'Test',
    lastName: 'User',
    phone: '',
    college: '',
    year: '',
    role: 'STUDENT',
    password: 'dummy-password',
    createdAt: now(),
    updatedAt: now(),
    ...data,
  };
  db.users.push(row);
  return row;
}

export function addOrder(userId: string, total = 1180): Row {
  const row = {
    id: id(),
    orderNumber: `ACE-TEST-${db.orders.length + 1}`,
    userId,
    subtotal: 1000,
    discount: 0,
    tax: 180,
    total,
    currency: 'INR',
    status: 'PENDING',
    createdAt: now(),
    updatedAt: now(),
  };
  db.orders.push(row);
  db.orderItems.push({
    id: id(),
    orderId: row.id,
    productId: 'mock',
    productName: 'Paid Mock Series',
    unitPrice: 1000,
    quantity: 1,
    taxSnapshot: 18,
    discountSnapshot: 0,
    lineTotal: total,
  });
  return row;
}

/** Stores a valid guest-checkout OTP for `email` and returns the code. */
export function addOtp(email: string, code = '123456'): string {
  db.otps = db.otps.filter((o) => o.email !== email.toLowerCase());
  db.otps.push({ id: id(), email: email.toLowerCase(), code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
  return code;
}
