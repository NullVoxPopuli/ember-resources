import { readdirSync, readFileSync  } from 'node:fs';
import { join, extname } from 'node:path';
import * as url from 'node:url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import { it, describe, expect } from 'vitest';

import { rules } from '../src/index.js';

const RULE_NAMES = Object.keys(rules);

describe('rules setup is correct', function () {
  it('should have a list of exported rules and rules directory that match', function () {
    const path = join(__dirname, '..', 'src', 'rules');
    const files = readdirSync(path);
    const expected = 
      files.filter((file) => !file.startsWith('.')).map((file) => file.replace('.js', '')).sort();

    expect([...RULE_NAMES].sort()).toEqual(
    expected);
  });

  it('should have tests for all rules', function () {
    const path = join(__dirname, '..', 'tests', 'rules');
    const files = readdirSync(path);

    const testFiles = files
      .filter((file) => !file.startsWith('.'))
      .map((file) => file.replace(extname(file), ''));

    for (const rule of RULE_NAMES) {
      let success = false;

      for (const testFile of testFiles) {
        if (testFile.startsWith(rule)) {
          success = true;
        }
      }

      expect(success, `${rule} has corresponding test file`).toBe(true);
    }
  });

  it('should have documentation for all rules', function () {
    const path = join(__dirname, '..', 'docs', 'rules');
    const files = readdirSync(path);
    const expected = 
      files
        .filter((file) => !file.startsWith('.') && file !== '_TEMPLATE_.md')
        .map((file) => file.replace('.md', '')).sort();

    expect([ ...RULE_NAMES ].sort()).toEqual(
    expected);
  });

  it('should have the right contents (title, examples, fixable notice) for each rule documentation file', function () {
    const FIXABLE_MSG =
      ':wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.';

    RULE_NAMES.forEach((ruleName) => {
      const rule = rules[ruleName];
      const path = join(__dirname, '..', 'docs', 'rules', `${ruleName}.md`);
      const file = readFileSync(path, 'utf8');

      expect(file).toContain(`# ${ruleName}`); // Title header.
      expect(file).toContain('## Examples'); // Examples section header.

      if (['code', 'whitespace'].includes(rule.meta.fixable)) {
        expect(file).toContain(FIXABLE_MSG);
      } else {
        expect(file).not.toContain(FIXABLE_MSG);
      }
    });
  });

  it('should mention all rules in the README', function () {
    const path = join(__dirname, '..', 'README.md');
    const file = readFileSync(path, 'utf8');

    RULE_NAMES.forEach((ruleName) => expect(file).toContain(ruleName));
  });
});
