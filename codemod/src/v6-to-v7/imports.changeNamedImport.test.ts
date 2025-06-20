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

  /**
   * https://github.com/NullVoxPopuli/ember-resources/issues/1195#issuecomment-2992470578
   *
   * Repro for #1195
   */
  test(`existing imports that aren't relevant remain intact`, () => {
    let text = `
import * as emberComponent from '@ember/component';
import * as emberComponentTemplateOnly from '@ember/component/template-only';
import * as emberDestroyable from '@ember/destroyable';
import * as emberHelper from '@ember/helper';
import * as emberModifier from '@ember/modifier';
import * as emberObject from '@ember/object';
import * as emberObjectInternals from '@ember/object/internals';
import * as emberTemplate from '@ember/template';
import * as emberTemplateFactory from '@ember/template-factory';
import * as glimmerComponent from '@glimmer/component';
import * as glimmerTracking from '@glimmer/tracking';

import * as dateFns from 'date-fns';
import * as emberConcurrency from 'ember-concurrency';
import * as emberConcurrencyAsyncArrowRuntime from 'ember-concurrency/-private/async-arrow-runtime';
import * as cssUrl from 'ember-css-url';
import * as emberModifier2 from 'ember-modifier';
import * as emberModifyClassBasedResource from 'ember-modify-based-class-resource';
import * as emberProvideConsumeContext from 'ember-provide-consume-context';
import * as emberProvideConsumeContextContextConsumer from 'ember-provide-consume-context/components/context-consumer';
import * as emberProvideConsumeContextContextProvider from 'ember-provide-consume-context/components/context-provider';
import * as emberResources from 'ember-resources';
import * as flat from 'flat';
import * as lodash from 'lodash';
import * as matrixJsSDK from 'matrix-js-sdk';
import * as superFastMD5 from 'super-fast-md5';
import * as tracked from 'tracked-built-ins';

import * as boxelUiComponents from '@cardstack/boxel-ui/components';
import * as boxelUiHelpers from '@cardstack/boxel-ui/helpers';
import * as boxelUiIcons from '@cardstack/boxel-ui/icons';
import * as boxelUiModifiers from '@cardstack/boxel-ui/modifiers';

import * as runtime from '@cardstack/runtime-common';
import { VirtualNetwork } from '@cardstack/runtime-common';
`;
    let result = doIt(text);

    expect(result).toMatchInlineSnapshot(`
      "
      import * as emberComponent from '@ember/component';
      import * as emberComponentTemplateOnly from '@ember/component/template-only';
      import * as emberDestroyable from '@ember/destroyable';
      import * as emberHelper from '@ember/helper';
      import * as emberModifier from '@ember/modifier';
      import * as emberObject from '@ember/object';
      import * as emberObjectInternals from '@ember/object/internals';
      import * as emberTemplate from '@ember/template';
      import * as emberTemplateFactory from '@ember/template-factory';
      import * as glimmerComponent from '@glimmer/component';
      import * as glimmerTracking from '@glimmer/tracking';

      import * as dateFns from 'date-fns';
      import * as emberConcurrency from 'ember-concurrency';
      import * as emberConcurrencyAsyncArrowRuntime from 'ember-concurrency/-private/async-arrow-runtime';
      import * as cssUrl from 'ember-css-url';
      import * as emberModifier2 from 'ember-modifier';
      import * as emberModifyClassBasedResource from 'ember-modify-based-class-resource';
      import * as emberProvideConsumeContext from 'ember-provide-consume-context';
      import * as emberProvideConsumeContextContextConsumer from 'ember-provide-consume-context/components/context-consumer';
      import * as emberProvideConsumeContextContextProvider from 'ember-provide-consume-context/components/context-provider';
      import * as emberResources from 'ember-resources';
      import * as flat from 'flat';
      import * as lodash from 'lodash';
      import * as matrixJsSDK from 'matrix-js-sdk';
      import * as superFastMD5 from 'super-fast-md5';
      import * as tracked from 'tracked-built-ins';

      import * as boxelUiComponents from '@cardstack/boxel-ui/components';
      import * as boxelUiHelpers from '@cardstack/boxel-ui/helpers';
      import * as boxelUiIcons from '@cardstack/boxel-ui/icons';
      import * as boxelUiModifiers from '@cardstack/boxel-ui/modifiers';

      import * as runtime from '@cardstack/runtime-common';
      import { VirtualNetwork } from '@cardstack/runtime-common';
      "
    `);
  });
});
