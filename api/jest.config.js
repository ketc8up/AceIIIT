/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/setup-env.ts', '/tests/db-guard.ts'],
};
