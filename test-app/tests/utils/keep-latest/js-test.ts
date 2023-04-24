import { tracked } from '@glimmer/tracking';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { use } from 'ember-resources';
import { trackedFunction } from 'ember-resources/util/function';
import { keepLatest } from 'ember-resources/util/keep-latest';

const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

module('Utils | keepLatest | js', function (hooks) {
  setupTest(hooks);

  test('it works with a trackedFunction', async function (assert) {
    class Test {
      @tracked x = 1;

      // @use request = trackedFunction(async () => {
      request = trackedFunction(this, async () => {
        let value = this.x;

        await timeout(30);

        return value;
      });

      @use data = keepLatest({
        when: () => this.request.isPending,
        value: () => this.request.value,
      });
    }

    let instance = new Test();

    assert.strictEqual(instance.data, undefined);

    await timeout(100);

    assert.strictEqual(instance.data, 1);

    instance.x = 2;

    assert.strictEqual(instance.data, 1);
    await timeout(15);
    assert.strictEqual(instance.data, 1);
    await timeout(100);
    assert.strictEqual(instance.data, 2);
  });

  test('it works if the value gets reset to undefined while loading', async function (assert) {
    class Test {
      @tracked isLoading = false;
      @tracked value?: number = 3;

      @use data = keepLatest({
        when: () => this.isLoading,
        value: () => this.value,
      });
    }

    let instance = new Test();

    assert.strictEqual(instance.data, 3);

    instance.isLoading = true;
    instance.value = undefined;

    assert.strictEqual(instance.data, 3);
  });

  test('it works with array values correctly', async function (assert) {
    class Test {
      @tracked isLoading = false;
      @tracked value = ['a'];

      @use data = keepLatest({
        when: () => this.isLoading,
        value: () => this.value,
      });
    }

    let instance = new Test();

    assert.deepEqual(instance.data, ['a']);

    instance.isLoading = true;

    instance.value = ['b'];

    assert.deepEqual(instance.data, ['b'], 'still returns the current value if it is not empty');

    instance.value = [];

    assert.deepEqual(
      instance.data,
      ['b'],
      'returns the previous value if the current value is empty'
    );
  });

  test('it works with object values correctly', async function (assert) {
    class Test {
      @tracked isLoading = false;
      @tracked value: Record<string, unknown> = { x: 3 };

      @use data = keepLatest({
        when: () => this.isLoading,
        value: () => this.value,
      });
    }

    let instance = new Test();

    assert.deepEqual(instance.data, { x: 3 });

    instance.isLoading = true;

    instance.value = { y: 4 };

    assert.deepEqual(instance.data, { y: 4 }, 'still returns the current value if it is not empty');

    instance.value = {};

    assert.deepEqual(
      instance.data,
      { y: 4 },
      'returns the previous value if the current value is empty'
    );
  });

  test('it works with string values correctly', async function (assert) {
    class Test {
      @tracked isLoading = false;
      @tracked value = 'one';

      @use data = keepLatest({
        when: () => this.isLoading,
        value: () => this.value,
      });
    }

    let instance = new Test();

    assert.deepEqual(instance.data, 'one');

    instance.isLoading = true;

    instance.value = 'two';

    assert.deepEqual(instance.data, 'two', 'still returns the current value if it is not empty');

    instance.value = '';

    assert.deepEqual(
      instance.data,
      'two',
      'returns the previous value if the current value is empty'
    );
  });

  test('it works with number values correctly', async function (assert) {
    class Test {
      @tracked isLoading = false;
      @tracked value: number | null = 1;

      @use data = keepLatest({
        when: () => this.isLoading,
        value: () => this.value,
      });
    }

    let instance = new Test();

    assert.deepEqual(instance.data, 1);

    instance.isLoading = true;

    instance.value = 2;

    assert.deepEqual(instance.data, 2, 'still returns the current value if it is not empty');

    instance.value = 0;

    assert.deepEqual(instance.data, 0, 'does not treat 0 as empty');

    instance.value = null;

    assert.deepEqual(instance.data, 0, 'returns the previous value if the current value is null');
  });
});
