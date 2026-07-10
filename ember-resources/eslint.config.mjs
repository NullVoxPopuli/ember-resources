import { configs } from '@nullvoxpopuli/eslint-configs';

const config = configs.ember(import.meta.dirname);

export default [
  ...config,
  {
    files: ['**/*.ts'],
    rules: {
      /**
       * any can be useful
       */
      '@typescript-eslint/no-explicit-any': 'off',
      /**
       * there is heavy use of `object` in this library
       */
      '@typescript-eslint/no-empty-object-type': 'off',
      /**
       * The following types do are not defined by the definitely typed packages
       * - @glimmer/tracking/primitives/cache
       *   - getValue
       * - @ember/helper
       *   - invokeHelper
       *   - capabilities
       *   - setHelperManager
       */
      '@typescript-eslint/ban-ts-comment': 'off',
      /**
       * Due to the above missing types, values from those imports are `any`,
       * and this library works with a lot of framework-internal dynamic values
       */
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['src/type-tests/**'],
    rules: {
      /**
       * type-tests declare values that are only used in type positions
       */
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
