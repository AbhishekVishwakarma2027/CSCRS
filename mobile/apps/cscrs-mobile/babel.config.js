module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@cscrs/config': '../../packages/config/src',
            '@cscrs/design-system': '../../packages/design-system/src',
            '@cscrs/models': '../../packages/models/src',
            '@cscrs/api': '../../packages/api/src',
            '@cscrs/auth': '../../packages/auth/src',
            '@cscrs/storage': '../../packages/storage/src',
            '@cscrs/utils': '../../packages/utils/src',
            '@src': '../../src',
            '@app': '../../src/app',
            '@core': '../../src/core',
            '@features': '../../src/features',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
    ],
  };
};
