'use strict';

module.exports = {
  extends: 'recommended',
  overrides: [
    {
      files: ['**/*.gjs', '**/*.gts'],
      rules: {
        'no-curly-component-invocation': 'off',
        'no-implicit-this': 'off',
      },
    },
  ],
};
