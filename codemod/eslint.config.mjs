import { configs } from '@nullvoxpopuli/eslint-configs';

const config = configs.node(import.meta.dirname);

export default [
  ...config,
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
      // these resolve to the .ts source files
      'n/no-missing-import': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      // declaration files have named args in function signatures
      'no-unused-vars': 'off',
    },
  },
];
