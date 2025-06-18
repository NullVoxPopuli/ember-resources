import { describe, expect, test } from 'vitest';

import { changeNamedImport } from './imports.js';

let doIt = (text: string) =>
  changeNamedImport(text, 'Resource', 'ember-resources', 'ember-modify-based-class-resource');

describe('Resource', () => {
  test('no match', () => {
    let text = `
      import { resource } from 'ember-resources';
    `;

    let result = doIt(text);

    expect(result).toContain('ember-resources');
    expect(result).toContain('resource');
    expect(result).not.toContain('ember-modify-based-class-resource');
  });

  test('inline', () => {
    let text = `
      import { Resource } from 'ember-resources';
    `;

    let result = doIt(text);

    expect(result).not.toContain('ember-resources');
    expect(result).toContain('Resource');
    expect(result).toContain('ember-modify-based-class-resource');
  });

  test('inline type import', () => {
    let text = `
      import { type Resource } from 'ember-resources';
    `;

    let result = doIt(text);

    expect(result).not.toContain('ember-resources');
    expect(result).toContain('Resource');
    expect(result).toContain('ember-modify-based-class-resource');
  });

  test('inline, double quotes', () => {
    let text = `
      import { Resource } from "ember-resources";
    `;

    let result = doIt(text);

    expect(result).not.toContain('ember-resources');
    expect(result).toContain('Resource');
    expect(result).toContain('ember-modify-based-class-resource');
  });

  test('inline, with other imports', () => {
    let text = `
      import { use, Resource } from 'ember-resources';
    `;

    let result = doIt(text);

    expect(result).toContain('ember-resources');
    expect(result).toContain('use');
    expect(result).toContain('Resource');
    expect(result).toContain('ember-modify-based-class-resource');
  });

  test('inline, with type imports', () => {
    let text = `
      import { type use, Resource } from 'ember-resources';
    `;

    let result = doIt(text);

    expect(result).toContain('ember-resources');
    expect(result).toContain('use');
    expect(result).toContain('Resource');
    expect(result).toContain('ember-modify-based-class-resource');
    expect(result).toMatchInlineSnapshot(`
      "
      import { Resource } from 'ember-modify-based-class-resource';
      import { type use } from 'ember-resources';
          "
    `);
  });

  test('inline, with other imports, reversed', () => {
    let text = `
      import { Resource, use } from 'ember-resources';
    `;

    let result = doIt(text);

    expect(result).toContain('ember-resources');
    expect(result).toContain('use');
    expect(result).toContain('Resource');
    expect(result).toContain('ember-modify-based-class-resource');
  });

  test('inline, with other imports, mixed', () => {
    let text = `
      import { resource, Resource, use } from 'ember-resources';
    `;

    let result = doIt(text);

    expect(result).toContain('ember-resources');
    expect(result).toContain('use');
    expect(result).toContain('resource');
    expect(result).toContain('Resource');
    expect(result).toContain('ember-modify-based-class-resource');
  });

  test('inline, with other imports, double quotes', () => {
    let text = `
      import { use, Resource } from "ember-resources";
    `;

    let result = doIt(text);

    expect(result).toContain('ember-resources');
    expect(result).toContain('use');
    expect(result).toContain('Resource');
    expect(result).toContain('ember-modify-based-class-resource');
  });

  test('multi-line', () => {
    let text = `
      import { 
        Resource 
      } from 'ember-resources';
    `;

    let result = doIt(text);

    expect(result).not.toContain('ember-resources');
    expect(result).toContain('Resource');
    expect(result).toContain('ember-modify-based-class-resource');
    expect(result).toMatchInlineSnapshot(`
      "
      import { Resource } from 'ember-modify-based-class-resource';
          "
    `);
  });

  test('multi-line, with other imports', () => {
    let text = `
      import { 
        resource, 
        Resource, 
        use,
      } from 'ember-resources';
    `;

    let result = doIt(text);

    expect(result).toContain('ember-resources');
    expect(result).toContain('use');
    expect(result).toContain('resource');
    expect(result).toContain('Resource');
    expect(result).toContain('ember-modify-based-class-resource');

    expect(result).toMatchInlineSnapshot(`
      "
      import { Resource } from 'ember-modify-based-class-resource';
      import { resource, use } from 'ember-resources';
          "
    `);
  });
});
