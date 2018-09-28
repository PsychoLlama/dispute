// @flow
module.exports = {
  testMatch: ['**/src/**/__tests__/*.test.js'],
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
