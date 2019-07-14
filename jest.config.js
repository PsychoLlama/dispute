module.exports = {
  testMatch: ['<rootDir>/src/**/__tests__/*.test.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.js', '!**/node_modules/**'],
  coverageReporters: ['html'],
  testEnvironment: 'node',
  collectCoverage: true,
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  coverageThreshold: {
    global: {
      statements: 100,
      functions: 100,
      branches: 100,
      lines: 100,
    },
  },
};
