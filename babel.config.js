// Babel configuration for papex-app.
// `@react-native/babel-preset` covers the New Architecture, Flow, and TypeScript transforms
// and is reused by both Metro (app bundle) and Jest (tests).
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    test: {
      presets: [
        'module:@react-native/babel-preset',
        ['@babel/preset-env', { targets: { node: 'current' } }],
      ],
    },
  },
};
