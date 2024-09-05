import { describe, expect, test } from 'vitest';

import { changeImportPaths } from './imports.js';
import { emberModifyBasedClassResource, moves, reactiveWeb } from './replacements.js';

describe('reactiveWeb', () => {
  test('all at once', () => {
    let text = `
      import { link } from 'ember-resources/link';
      import { modifier } from 'ember-resources/modifier';
      import { service } from 'ember-resources/service';
      import { debounce } from 'ember-resources/util/debounce';
      import { task, trackedTask } from 'ember-resources/util/ember-concurrency';
      import { FrameRate, UpdateFrequency } from 'ember-resources/util/fps';
      import { trackedFunction } from 'ember-resources/util/function';
      import { helper } from 'ember-resources/util/helper';
      import { keepLatest } from 'ember-resources/util/keep-latest';
      import { map } from 'ember-resources/util/map';
      import { remoteData, RemoteData } from 'ember-resources/util/remote-data';

      import { tracked } from '@glimmer/tracking';
      import Component from '@glimmer/component';
      export default class X extends Componetn {
        @tracked foo = 2;

        <template>hello there {{this.foo}}</template>
      }
    `;

    for (let original of Object.keys(reactiveWeb)) {
      expect(text).toContain(original);
    }

    let fixed = changeImportPaths(text, reactiveWeb);

    for (let original of Object.keys(reactiveWeb)) {
      expect(fixed).not.toContain(original);
    }

    for (let replacement of Object.values(reactiveWeb)) {
      expect(fixed).toContain(replacement);
    }
  });

  for (let [original, replacement] of Object.entries(reactiveWeb)) {
    test(`${original}, only`, () => {
      let text = `import { /* ... */ } from '${original}';`;

      expect(text).toContain(original);

      let fixed = changeImportPaths(text, reactiveWeb);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, double quotes`, () => {
      let text = `import { /* ... */ } from "${original}";`;

      expect(text).toContain(original);

      let fixed = changeImportPaths(text, reactiveWeb);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, with other imports`, () => {
      let text = `
        import { /* ... */ } from '${original}';
        import { tracked } from '@glimmer/tracking';
        import Component from '@glimmer/component';
        export default class X extends Componetn {
          @tracked foo = 2;

          <template>hello there {{this.foo}}</template>
        }
      `;

      expect(text).toContain(original);

      let fixed = changeImportPaths(text, reactiveWeb);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });
  }
});

describe('moves', () => {
  test('all at once', () => {
    let text = `
      import { cell } from 'ember-resources/util/cell';
      import { resource } from 'ember-resources/core/function-based';
      import { use, resource, Resource } from 'ember-resources/core';

      import { tracked } from '@glimmer/tracking';
      import Component from '@glimmer/component';
      export default class X extends Componetn {
        @tracked foo = 2;

        <template>hello there {{this.foo}}</template>
      }
    `;

    for (let original of Object.keys(moves)) {
      expect(text).toContain(original);
    }

    let fixed = changeImportPaths(text, moves);

    for (let original of Object.keys(moves)) {
      expect(fixed).not.toContain(original);
    }

    for (let replacement of Object.values(moves)) {
      expect(fixed).toContain(replacement);
    }
  });

  for (let [original, replacement] of Object.entries(moves)) {
    test(`${original}, only`, () => {
      let text = `import { /* ... */ } from '${original}';`;

      expect(text).toContain(original);

      let fixed = changeImportPaths(text, moves);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, double quotes`, () => {
      let text = `import { /* ... */ } from "${original}";`;

      expect(text).toContain(original);

      let fixed = changeImportPaths(text, moves);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, with other imports`, () => {
      let text = `
        import { /* ... */ } from '${original}';
        import { tracked } from '@glimmer/tracking';
        import Component from '@glimmer/component';
        export default class X extends Componetn {
          @tracked foo = 2;

          <template>hello there {{this.foo}}</template>
        }
      `;

      expect(text).toContain(original);

      let fixed = changeImportPaths(text, moves);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });
  }
});

describe('emberModifyBasedClassResource', () => {
  test('all at once', () => {
    let text = `
      import { Resource } from 'ember-resources/core/class-based';

      import { tracked } from '@glimmer/tracking';
      import Component from '@glimmer/component';
      export default class X extends Componetn {
        @tracked foo = 2;

        <template>hello there {{this.foo}}</template>
      }
    `;

    for (let original of Object.keys(emberModifyBasedClassResource)) {
      expect(text).toContain(original);
    }

    let fixed = changeImportPaths(text, emberModifyBasedClassResource);

    for (let original of Object.keys(emberModifyBasedClassResource)) {
      expect(fixed).not.toContain(original);
    }

    for (let replacement of Object.values(emberModifyBasedClassResource)) {
      expect(fixed).toContain(replacement);
    }
  });

  for (let [original, replacement] of Object.entries(emberModifyBasedClassResource)) {
    test(`${original}, only`, () => {
      let text = `import { /* ... */ } from '${original}';`;

      expect(text).toContain(original);

      let fixed = changeImportPaths(text, emberModifyBasedClassResource);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, double quotes`, () => {
      let text = `import { /* ... */ } from "${original}";`;

      expect(text).toContain(original);

      let fixed = changeImportPaths(text, emberModifyBasedClassResource);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, with other imports`, () => {
      let text = `
        import { /* ... */ } from '${original}';
        import { tracked } from '@glimmer/tracking';
        import Component from '@glimmer/component';
        export default class X extends Componetn {
          @tracked foo = 2;

          <template>hello there {{this.foo}}</template>
        }
      `;

      expect(text).toContain(original);

      let fixed = changeImportPaths(text, emberModifyBasedClassResource);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });
  }
});
