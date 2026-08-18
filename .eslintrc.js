module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2021, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { es2021: true, node: true, jest: true },
  // React Native / browser runtime globals used across src (fetch, URL, ...).
  globals: {
    __DEV__: 'readonly',
    fetch: 'readonly',
    FormData: 'readonly',
    URL: 'readonly',
    AbortController: 'readonly',
    Headers: 'readonly',
    Request: 'readonly',
    Response: 'readonly',
    Blob: 'readonly',
    requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly',
    alert: 'readonly',
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['node_modules', 'coverage', 'android', 'ios', 'harmony', '*.json'],
};
