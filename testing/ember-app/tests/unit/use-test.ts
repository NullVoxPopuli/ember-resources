import { tracked } from '@glimmer/tracking';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
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

      assert.equal(instance.data.doubled, 2);

      instance.num = 3;
      await settled();

      assert.equal(instance.data.doubled, 6);
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

      assert.equal(instance.data.doubled, 2);

      instance.num = 3;
      await settled();

      assert.equal(instance.data.doubled, 6);
    });
  });
  module('Task', function () {});
  module('Function', function () {
    test('it works with sync functions', async function (assert) {
      class Test {
        @tracked num = 1;

        // How to make TS happy about this?
        @use data = () => {
          return this.num * 2;
        };
      }

      let instance = new Test();

      assert.equal(instance.data, undefined);
      await settled();
      assert.equal(instance.data, 2);

      instance.num = 3;
      await settled();

      assert.equal(instance.data, 6);
    });

    test('it works with async functions', async function (assert) {
      class Test {
        @tracked num = 1;

        // How to make TS happy about this?
        @use data = async () => {
          await timeout(100);

          return this.num * 2;
        };
      }

      let instance = new Test();

      assert.equal(instance.data, undefined);
      await timeout(100);
      await settled();

      assert.equal(instance.data, 2);

      instance.num = 3;
      await settled();

      assert.equal(instance.data, 6);
    });
  });
});
