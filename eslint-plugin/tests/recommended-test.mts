import { it, describe, expect } from 'vitest';

import { rules } from '../src/index.js';

describe('recommended rules', () => {
  it('has the right list', () => {
    const errors: string[] = [];

    Object.keys(rules).forEach((name) => {
      if (rules[name]?.meta?.docs?.recommended) {
        errors.push(name);
      }
    });

    expect(errors).toMatchSnapshot();
  });
});
