import { configs } from '@nullvoxpopuli/eslint-configs';

const config = configs.ember(import.meta.dirname);

export default [
  {
    ignores: [
      // ember-try
      '.node_modules.ember-try/',
      'bower.json.ember-try',
      'package.json.ember-try',
    ],
  },
  ...config,
  /**
   * These tests are shared with (copied to) ../ember7-vite, which uses a
   * different lint config -- these relaxations keep the two copies in sync.
   */
  {
    files: ['tests/**/*.{js,gjs,ts,gts}'],
    languageOptions: {
      globals: {
        // used in testing as a shorthand for <output>
        out: true,
      },
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'ember/no-test-import-export': 'off',
      'ember/template-no-let-reference': 'off',
      'prefer-const': 'off',
      'qunit/require-expect': 'off',
      'qunit/no-conditional-assertions': 'off',
    },
  },
  {
    files: ['**/*.{ts,gts}'],
    rules: {
      /**
       * any can be useful
       */
      '@typescript-eslint/no-explicit-any': 'off',
      /**
       * Some compiler errors are not helpful
       */
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': 'allow-with-description',
          'ts-check': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
        },
      ],
    },
  },
];
