// @flow
module.exports = {
  testMatch: ['<rootDir>/src/**/__tests__/*.test.js'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,jsx}', '!**/node_modules/**'],
  coverageReporters: ['html'],
  testEnvironment: 'node',
  collectCoverage: true,
  coverageThreshold: {
    statements: 100,
    functions: 100,
    branches: 100,
    lines: 100,
  },
};
