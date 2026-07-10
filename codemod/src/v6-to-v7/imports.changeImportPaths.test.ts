import { describe, expect, test } from 'vitest';

import { changeImportPaths } from './imports.js';
import { emberModifyBasedClassResource, moves, reactiveWeb } from './replacements.js';

describe('reactiveWeb', () => {
  test('all at once', () => {
    const text = `
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

    for (const original of Object.keys(reactiveWeb)) {
      expect(text).toContain(original);
    }

    const fixed = changeImportPaths(text, reactiveWeb);

    for (const original of Object.keys(reactiveWeb)) {
      expect(fixed).not.toContain(original);
    }

    for (const replacement of Object.values(reactiveWeb)) {
      expect(fixed).toContain(replacement);
    }
  });

  for (const [original, replacement] of Object.entries(reactiveWeb)) {
    test(`${original}, only`, () => {
      const text = `import { /* ... */ } from '${original}';`;

      expect(text).toContain(original);

      const fixed = changeImportPaths(text, reactiveWeb);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, double quotes`, () => {
      const text = `import { /* ... */ } from "${original}";`;

      expect(text).toContain(original);

      const fixed = changeImportPaths(text, reactiveWeb);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, with other imports`, () => {
      const text = `
        import { /* ... */ } from '${original}';
        import { tracked } from '@glimmer/tracking';
        import Component from '@glimmer/component';
        export default class X extends Componetn {
          @tracked foo = 2;

          <template>hello there {{this.foo}}</template>
        }
      `;

      expect(text).toContain(original);

      const fixed = changeImportPaths(text, reactiveWeb);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });
  }
});

describe('moves', () => {
  test('all at once', () => {
    const text = `
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

    for (const original of Object.keys(moves)) {
      expect(text).toContain(original);
    }

    const fixed = changeImportPaths(text, moves);

    for (const original of Object.keys(moves)) {
      expect(fixed).not.toContain(original);
    }

    for (const replacement of Object.values(moves)) {
      expect(fixed).toContain(replacement);
    }
  });

  for (const [original, replacement] of Object.entries(moves)) {
    test(`${original}, only`, () => {
      const text = `import { /* ... */ } from '${original}';`;

      expect(text).toContain(original);

      const fixed = changeImportPaths(text, moves);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, double quotes`, () => {
      const text = `import { /* ... */ } from "${original}";`;

      expect(text).toContain(original);

      const fixed = changeImportPaths(text, moves);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, with other imports`, () => {
      const text = `
        import { /* ... */ } from '${original}';
        import { tracked } from '@glimmer/tracking';
        import Component from '@glimmer/component';
        export default class X extends Componetn {
          @tracked foo = 2;

          <template>hello there {{this.foo}}</template>
        }
      `;

      expect(text).toContain(original);

      const fixed = changeImportPaths(text, moves);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });
  }
});

describe('emberModifyBasedClassResource', () => {
  test('all at once', () => {
    const text = `
      import { Resource } from 'ember-resources/core/class-based';

      import { tracked } from '@glimmer/tracking';
      import Component from '@glimmer/component';
      export default class X extends Componetn {
        @tracked foo = 2;

        <template>hello there {{this.foo}}</template>
      }
    `;

    for (const original of Object.keys(emberModifyBasedClassResource)) {
      expect(text).toContain(original);
    }

    const fixed = changeImportPaths(text, emberModifyBasedClassResource);

    for (const original of Object.keys(emberModifyBasedClassResource)) {
      expect(fixed).not.toContain(original);
    }

    for (const replacement of Object.values(emberModifyBasedClassResource)) {
      expect(fixed).toContain(replacement);
    }
  });

  for (const [original, replacement] of Object.entries(emberModifyBasedClassResource)) {
    test(`${original}, only`, () => {
      const text = `import { /* ... */ } from '${original}';`;

      expect(text).toContain(original);

      const fixed = changeImportPaths(text, emberModifyBasedClassResource);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, double quotes`, () => {
      const text = `import { /* ... */ } from "${original}";`;

      expect(text).toContain(original);

      const fixed = changeImportPaths(text, emberModifyBasedClassResource);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });

    test(`${original}, with other imports`, () => {
      const text = `
        import { /* ... */ } from '${original}';
        import { tracked } from '@glimmer/tracking';
        import Component from '@glimmer/component';
        export default class X extends Componetn {
          @tracked foo = 2;

          <template>hello there {{this.foo}}</template>
        }
      `;

      expect(text).toContain(original);

      const fixed = changeImportPaths(text, emberModifyBasedClassResource);

      expect(fixed).not.toContain(original);
      expect(fixed).toContain(replacement);
    });
  }
});
