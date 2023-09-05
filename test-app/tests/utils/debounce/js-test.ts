import { tracked } from '@glimmer/tracking';
import { setOwner } from '@ember/application';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { use } from 'ember-resources';
import { debounce } from 'ember-resources/util/debounce';

module('Utils | debounce | js', function (hooks) {
  setupTest(hooks);

  let someTime = (ms = 25) => new Promise((resolve) => setTimeout(resolve, ms));

  module('debounce', function () {
    test('works with @use', async function (assert) {
      class Test {
        @tracked data = 'initial';

        @use text = debounce(100, () => this.data);
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.text, undefined, 'Initial value is undefined');

      test.data = 'b';

      // 25ms
      await someTime();
      assert.strictEqual(test.text, undefined, 'Initial value is undefined');
      test.data = 'bo';

      // another 25ms (= ~50ms < 100ms debounce)
      await someTime();
      assert.strictEqual(test.text, undefined, 'Initial value is undefined');
      test.data = 'boo';

      // another 25ms (= ~75ms < 100ms debounce)
      await someTime();
      assert.strictEqual(test.text, undefined, 'Initial value is undefined');

      // 110ms > 100ms debounce, value should be set now
      await someTime(110);
      assert.strictEqual(test.text, 'boo');

      // change the value again, wait 0ms, value is not updated yet
      test.data = 'boop';
      assert.strictEqual(test.text, 'boo');

      // wait at least 100ms, value is now updated
      await someTime(110);
      assert.strictEqual(test.text, 'boop');
    });

    test('initialize = true', async function (assert) {
      class Test {
        @tracked data = 'initial';

        @use text = debounce(100, () => this.data, true);
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.text, 'initial');

      test.data = 'b';

      // 25ms
      await someTime();
      assert.strictEqual(test.text, 'initial');
      test.data = 'bo';

      // another 25ms (= ~50ms < 100ms debounce)
      await someTime();
      assert.strictEqual(test.text, 'initial');
      test.data = 'boo';

      // another 25ms (= ~75ms < 100ms debounce)
      await someTime();
      assert.strictEqual(test.text, 'initial');

      // 110ms > 100ms debounce, value should be set now
      await someTime(110);
      assert.strictEqual(test.text, 'boo');

      // change the value again, wait 0ms, value is not updated yet
      test.data = 'boop';
      assert.strictEqual(test.text, 'boo');

      // wait at least 100ms, value is now updated
      await someTime(110);
      assert.strictEqual(test.text, 'boop');
    });
  });
});
