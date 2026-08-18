/* Jest configuration for papex-app. */
module.exports = {
  preset: 'react-native',
  rootDir: '.',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    'src/lib/security/tokens.ts',
    'src/lib/api/client.ts',
    'src/lib/api/auth-refresh.ts',
    'src/lib/api/errors.ts',
    '!src/lib/types/**',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    // Plan requirement: core lib (tokens + client) must be ≥80% covered.
    './src/lib/security/tokens.ts': {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
    './src/lib/api/client.ts': {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
    './src/lib/api/auth-refresh.ts': {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
    './src/lib/api/errors.ts': {
      statements: 70,
      branches: 50,
      functions: 70,
      lines: 70,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|zustand|i18next|react-i18next|react-native-mmkv|react-native-keychain|react-native-pdf|react-native-safe-area-context|react-native-screens)/)',
  ],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
    '^@stores/(.*)$': '<rootDir>/src/stores/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
};
