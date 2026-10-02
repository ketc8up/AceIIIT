/**
 * Create or reset an admin account.
 *
 *   npm run admin:create -- admin@example.com
 *
 * The password is read from a hidden prompt (or ADMIN_PASSWORD for non-interactive
 * use) and stored as a bcrypt hash. This is the only way to create an ADMIN user.
 * It writes to the database configured by DATABASE_URL in api/.env.
 */
import dotenv from 'dotenv';
import readline from 'readline';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

dotenv.config({ quiet: true });

const MIN_PASSWORD_LENGTH = 6;
const BCRYPT_COST = 12;

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const rlAny = rl as any;
    const originalWrite = rlAny._writeToOutput?.bind(rl);
    rlAny._writeToOutput = (text: string) => {
      // Echo only the prompt itself, never the typed characters.
      if (text.includes(question)) originalWrite?.(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const emailArg = process.argv[2];
  const email = z.email().safeParse(emailArg?.trim().toLowerCase());
  if (!email.success) {
    console.error('Usage: npm run admin:create -- <admin-email>');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await promptHidden(`Password for ${email.data}: `);
    const confirm = await promptHidden('Confirm password: ');
    if (password !== confirm) {
      console.error('Passwords do not match.');
      process.exit(1);
    }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash(password, BCRYPT_COST);
    const user = await prisma.user.upsert({
      where: { email: email.data },
      update: { role: 'ADMIN', password: hash },
      create: {
        firstName: 'Admin',
        lastName: 'User',
        email: email.data,
        phone: '',
        role: 'ADMIN',
        password: hash,
      },
    });
    console.log(`Admin account ready: ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Failed to create admin:', err instanceof Error ? err.message : err);
  process.exit(1);
});
