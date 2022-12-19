import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';
import { RuleTester } from 'eslint';

import rule from '../../src/rules/no-this-property-assignment-in-tracked-function.js';

const __filename = fileURLToPath(import.meta.url);
const filename = basename(__filename);

let ruleTester = new RuleTester({
  parser: require.resolve('@babel/eslint-parser'),
  parserOptions: {
    requireConfigFile: false,
  },
});

ruleTester.describe = describe;
ruleTester.it = it;

describe(filename, () => {
  ruleTester.run('no-this-property-assignment-in-tracked-function', rule, {
    valid: [
      {
        code:
          `import { trackedFunction } from 'ember-resources/util/function';\n` +
          'class Foo {\n' +
          '  foo = trackedFunction(this, async () => {\n' +
          '    await Promise.resolve();\n' +
          '  })\n' +
          '}',
      },
      {
        code:
          `import { trackedFunction } from 'ember-resources/util/function';\n` +
          'class Foo {\n' +
          '  foo = trackedFunction(this, async () => {\n' +
          '    await Promise.resolve();\n' +
          '    this.bar = 2;\n' +
          '  })\n' +
          '}',
        options: [{ allowAfterAwait: true }],
      },
    ],
    invalid: [
      // {
      //   code:
      //     `import { trackedFunction } from 'ember-resources/util/function';\n` +
      //     'class Foo {\n' +
      //     '  foo = trackedFunction(this, () => {\n' +
      //     '    this.bar = 2;\n' +
      //     '  })\n' +
      //     `}`,
      //   errors: [
      //     {
      //       suggestions: [
      //         {
      //           messageId: 'noSideEffects',
      //           output: '',
      //         },
      //       ],
      //     },
      //   ],
      // },
    ],
  });
});
