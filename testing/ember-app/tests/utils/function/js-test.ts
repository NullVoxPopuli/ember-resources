import { tracked } from '@glimmer/tracking';
import { destroy, isDestroyed, isDestroying } from '@ember/destroyable';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { trackedFunction } from 'ember-resources/util/function';

module('Utils | trackedFunction | js', function (hooks) {
  setupTest(hooks);

  test('lifecycle', async function (assert) {
    let runCount = 0;

    class Test {
      @tracked count = 1;

      data = trackedFunction(this, async () => {
        let count = this.count;

        runCount++;
        // Pretend we're doing async work
        await new Promise((resolve) => setTimeout(resolve, 20));

        if (isDestroying(this) || isDestroyed(this)) {
          return;
        }

        assert.step(`run ${runCount}, value: ${count}`);
      });
    }

    let foo = new Test();

    assert.strictEqual(foo.data.value, null);

    foo.data.value;
    await settled();

    foo.count = 2;
    foo.data.value;
    await settled();

    foo.count = 6;
    foo.data.value;
    destroy(foo); // this prevents a third run

    assert.verifySteps(['run 1, value: 1', 'run 2, value: 2']);
  });

  test('it works with sync functions', async function (assert) {
    class Test {
      @tracked count = 1;

      data = trackedFunction(this, () => {
        return this.count * 2;
      });
    }

    let foo = new Test();

    assert.strictEqual(foo.data.value, null);
    await settled();

    assert.strictEqual(foo.data.value, 2);

    foo.count = 2;
    foo.data.value;
    await settled();

    assert.strictEqual(foo.data.value, 4);

    foo.count = 6;
    foo.data.value;
    await settled();

    assert.strictEqual(foo.data.value, 12);

    foo.count = 7;
    foo.data.value;
    await settled();

    assert.strictEqual(foo.data.value, 14);
  });

  test('it works with async functions', async function (assert) {
    class Test {
      @tracked count = 1;

      data = trackedFunction(this, async () => {
        let count = this.count;

        // Pretend we're doing async work
        await Promise.resolve();

        return count * 2;
      });
    }

    let foo = new Test();

    assert.strictEqual(foo.data.value, null);

    foo.data.value;
    await settled();
    assert.strictEqual(foo.data.value, 2);

    foo.count = 2;
    foo.data.value;
    await settled();

    assert.strictEqual(foo.data.value, 4);

    foo.count = 6;
    foo.data.value;
    await settled();

    assert.strictEqual(foo.data.value, 12);
  });
});
