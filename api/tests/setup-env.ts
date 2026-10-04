import crypto from 'crypto';

// Runs before every test file (jest "setupFiles"), before any app module is imported.
// Real secrets from api/.env are never needed by the tests.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = crypto.randomBytes(48).toString('base64url');
process.env.INTERNAL_API_SECRET = crypto.randomBytes(32).toString('base64url');
process.env.JWT_EXPIRES_IN = '1h';
process.env.AUTH_RATE_LIMIT_PER_MIN = process.env.AUTH_RATE_LIMIT_PER_MIN || '1000';

// The API's config calls dotenv, which would load the real Resend key from api/.env.
// dotenv never overrides a variable that is already set, so pin a dummy key here:
// no test can ever send a real email.
process.env.RESEND_API_KEY = 're_test_disabled';
// Same for the other external services the API reaches: the Mock Portal's MongoDB
// (paid-access provisioning) and Supabase storage (receipts). The Mongo host can never
// resolve, and Supabase is left unconfigured, so tests can't touch real data.
process.env.MONGODB_URI = 'mongodb://test-guard.invalid:1/no-database';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.SUPABASE_ANON_KEY = '';

// Database safety guard: suites that write to a database only run against an explicit
// TEST_DATABASE_URL. Otherwise DATABASE_URL points nowhere, so no test can ever reach
// the real (production) database configured in api/.env.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DIRECT_URL = process.env.TEST_DATABASE_URL;
} else {
  process.env.DATABASE_URL = 'postgresql://test-guard:test-guard@127.0.0.1:1/no-database';
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}
