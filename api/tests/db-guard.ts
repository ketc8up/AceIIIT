// Suites that wipe and reseed tables must never run against the real database.
// They only run when TEST_DATABASE_URL is set (see setup-env.ts).
export const hasTestDatabase = !!process.env.TEST_DATABASE_URL;

export const describeDb: jest.Describe = hasTestDatabase ? describe : describe.skip;
