'use strict';

const { configs } = require('@nullvoxpopuli/eslint-configs');

const config = configs.ember();

module.exports = {
  ...config,
  overrides: [
    ...config.overrides,
    {
      files: ['**/*.ts'],
      rules: {
        /**
         * any can be useful
         */
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
