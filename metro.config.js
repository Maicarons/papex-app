const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration for papex-app.
 * RNOH (HarmonyOS) uses a separate Ohpm/ArkTS pipeline; Metro only serves
 * the Android / iOS bundles. PDF/font assets are whitelisted below.
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    assetExts: ['pdf', 'ttf', 'otf', 'png', 'jpg', 'jpeg', 'gif', 'webp'],
    sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
  },
  watchFolders: [],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
