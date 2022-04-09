/* eslint-disable @typescript-eslint/ban-ts-comment */
import { tracked } from '@glimmer/tracking';
import { settled } from '@ember/test-helpers';
import { module, skip, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { timeout } from 'ember-concurrency';
import { LifecycleResource, Resource, use } from 'ember-resources';

import type { Positional } from 'ember-resources';

module('@use', function (hooks) {
  setupTest(hooks);

  module('Resource', function () {
    test('it works', async function (assert) {
      class MyResource<Args extends Positional<[number]>> extends Resource<Args> {
        doubled = 0;

        constructor(owner: unknown, args: Args, previous?: MyResource<Args>) {
          super(owner, args, previous);

          this.doubled = previous?.doubled ?? 0;
          this.doubled = args.positional[0] * 2;
        }
      }

      class Test {
        @tracked num = 1;

        @use data = MyResource.with(() => [this.num]);

        // @use(() => [this.num]) data = MyResource;
        // @use data = MyResource.of(() => [this.num]);
        // @use data = MyResource.from(() => [this.num]);
      }

      let instance = new Test();

      assert.strictEqual(instance.data.doubled, 2);

      instance.num = 3;
      await settled();

      assert.strictEqual(instance.data.doubled, 6);
    });
  });
  module('LifecycleResource', function () {
    test('it works', async function (assert) {
      class MyResource<Args extends Positional<[number]>> extends LifecycleResource<Args> {
        doubled = 0;

        setup() {
          this.update();
        }

        update() {
          this.doubled = this.args.positional[0] * 2;
        }
      }

      class Test {
        @tracked num = 1;

        @use data = MyResource.with(() => [this.num]);
      }

      let instance = new Test();

      assert.strictEqual(instance.data.doubled, 2);

      instance.num = 3;
      await settled();

      assert.strictEqual(instance.data.doubled, 6);
    });
  });
  module('Task', function () {});
  module('Function', function () {
    skip('it works with sync functions', async function (assert) {
      class Test {
        @tracked num = 1;

        // How to make TS happy about this?
        @use data = () => {
          return this.num * 2;
        };
      }

      let instance = new Test();

      assert.strictEqual(instance.data, undefined);
      await settled();
      // @ts-expect-error
      assert.strictEqual(instance.data, 2);

      instance.num = 3;
      await settled();

      // @ts-expect-error
      assert.strictEqual(instance.data, 6);
    });

    skip('it works with async functions', async function (assert) {
      class Test {
        @tracked num = 1;

        // How to make TS happy about this?
        @use data = async () => {
          await timeout(100);

          return this.num * 2;
        };
      }

      let instance = new Test();

      assert.strictEqual(instance.data, undefined);
      await timeout(100);
      await settled();

      // @ts-expect-error
      assert.strictEqual(instance.data, 2);

      instance.num = 3;
      await settled();

      // @ts-expect-error
      assert.strictEqual(instance.data, 6);
    });
  });
});
