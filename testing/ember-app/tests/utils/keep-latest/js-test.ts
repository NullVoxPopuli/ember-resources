import { tracked } from '@glimmer/tracking';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { timeout } from 'ember-concurrency';
import { use } from 'ember-resources';
import { trackedFunction } from 'ember-resources/util/function';
import { keepLatest } from 'ember-resources/util/keep-latest';

module('Utils | keepLatest | js', function (hooks) {
  setupTest(hooks);

  test('it works', async function (assert) {
    class Test {
      @tracked x = 1;

      // @use request = trackedFunction(async () => {
      request = trackedFunction(this, async () => {
        let value = this.x;

        await timeout(30);

        return value;
      });

      @use data = keepLatest({
        until: () => this.request.isLoading,
        value: () => this.request.value,
      });
    }

    let instance = new Test();

    assert.strictEqual(instance.data, undefined);

    await timeout(40);

    assert.strictEqual(instance.data, 1);

    instance.x = 2;

    assert.strictEqual(instance.data, 1);
    await timeout(15);
    assert.strictEqual(instance.data, 1);
    await timeout(40);
    assert.strictEqual(instance.data, 2);
  });
});
