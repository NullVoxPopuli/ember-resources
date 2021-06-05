import { tracked } from '@glimmer/tracking';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { LifecycleResource, useResource } from 'ember-resources';

module('useResource', function (hooks) {
  setupTest(hooks);

  module('LifecycleResource', function () {
    test('it works', async function (assert) {
      class Doubler extends LifecycleResource<{ positional: [number] }> {
        @tracked num = 0;

        setup() {
          this.num = this.args.positional[0] * 2;
        }

        update() {
          this.num = this.args.positional[0] * 2;
        }
      }
      class Test {
        @tracked count = 0;

        data = useResource(this, Doubler, () => [this.count]);
      }

      let foo = new Test();

      assert.equal(foo.data.num, 0);

      foo.count = 3;
      await settled();

      assert.equal(foo.data.num, 6);

      foo.count = 4;
      await settled();

      assert.equal(foo.data.num, 8);
    });
  });

  module('functions', function () {
    test('it works with sync functions', async function (assert) {
      class Test {
        @tracked count = 1;

        data = useResource(
          this,
          (previous: number, count: number) => count * (previous || 1),
          () => [this.count]
        );
      }

      let foo = new Test();

      assert.equal(foo.data.value, 1);

      foo.count = 2;
      await settled();

      assert.equal(foo.data.value, 2);

      foo.count = 6;
      await settled();

      assert.equal(foo.data.value, 12);
    });
  });

  test('it works with async functions', async function (assert) {
    class Test {
      @tracked count = 1;

      data = useResource(
        this,
        async (previous: number, count: number) => {
          console.log({ previous, count });
          // Pretend we're doing async work
          await Promise.resolve();

          return count * (previous || 1);
        },
        () => [this.count]
      );
    }

    let foo = new Test();

    assert.equal(foo.data.value, undefined);

    foo.data.value;
    await settled();
    assert.equal(foo.data.value, 1);

    foo.count = 2;
    foo.data.value;
    await settled();

    assert.equal(foo.data.value, 2);

    foo.count = 6;
    foo.data.value;
    await settled();

    assert.equal(foo.data.value, 12);
  });
});
