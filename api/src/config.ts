import dotenv from 'dotenv';
import { z } from 'zod';

// Load api/.env once. Variables already present in the environment are never overridden.
dotenv.config({ quiet: true });

// Known placeholder / default values that must never be used as real secrets.
const INSECURE_SECRETS = new Set([
  'fallback-secret-key',
  'generate-a-strong-random-secret-key-here',
  'your-secure-internal-secret-for-s2s-calls',
  '<strong-random-production-secret>',
  '<strong-random-shared-secret>',
  'secret',
  'changeme',
  'change-me',
  'password',
]);

const isPlaceholder = (value: string) => {
  const v = value.trim().toLowerCase();
  return INSECURE_SECRETS.has(v) || v.startsWith('<') || /^(.)\1+$/.test(v);
};

const strongSecret = (min: number) =>
  z
    .string({ error: 'is required' })
    .min(min, { error: `must be at least ${min} characters` })
    .refine((v) => !isPlaceholder(v), { error: 'is a placeholder/insecure value' });

const ConfigSchema = z.object({
  NODE_ENV: z.string().default('development'),
  JWT_SECRET: strongSecret(32),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, { error: 'must look like 15m, 1h, 12h or 7d' })
    .default('1h'),
  INTERNAL_API_SECRET: strongSecret(16),
  AUTH_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(10),
  ADMIN_PORTAL_PATH: z.string().min(8).default('admin-secure-portal'),
  EMAIL_FROM_SUPPORT: z.string().min(5).default('onboarding@resend.dev'),
  EMAIL_FROM_OTP: z.string().min(5).default('onboarding@resend.dev'),
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    ),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

/**
 * Validates environment configuration. Throws if any required security setting is
 * missing or insecure. Error messages name the variable but never include its value.
 */
export function parseConfig(env: Record<string, string | undefined>): AppConfig {
  // Treat empty strings as missing so `JWT_SECRET=` fails with "is required".
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([, v]) => v !== undefined && v !== '')
  );
  const result = ConfigSchema.safeParse(cleaned);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'} ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid server configuration:\n${problems}`);
  }
  return result.data;
}

export const config = parseConfig(process.env);
