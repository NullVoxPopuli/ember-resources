'use strict';

const { configs } = require('@nullvoxpopuli/eslint-configs');

const config = configs.node();

module.exports = {
  ...config,
  overrides: [
    ...config.overrides,
    {
      files: ['**/*'],
      rules: {
        'n/no-process-exit': 'off',
      },
    },
    {
      files: ['**/*.test.ts'],
      rules: {
        'n/no-unpublished-import': 'off',
      },
    },
  ],
};
