import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from 'vitest';
import { RuleTester } from 'eslint';

import rule from '../../src/rules/no-this-property-assignment-in-tracked-function.js';

const __filename = fileURLToPath(import.meta.url);
const filename = basename(__filename);

let ruleTester = new RuleTester();


describe(filename, () => {
  ruleTester.run('no-this-property-assignment-in-tracked-function', rule, {
    valid: [
      `import { trackedFunction } from 'ember-resources/util/function';\n` 
      + `class Foo {\n`
      + '  foo = trackedFunction(this, () => {\n'
      + '    this.bar = 2;'                           
      + '  })\n'
      + `}`],
    invalid: [

    ],
  })
});

