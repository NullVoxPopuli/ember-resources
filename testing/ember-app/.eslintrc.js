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
         * This one is incorrectly parsed for now, because
         * the rule doesn't understand decorators
         */
        '@typescript-eslint/no-unused-vars': 'off',
        /**
         * any can be useful
         */
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
