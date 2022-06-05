import { tracked } from '@glimmer/tracking';
import { setOwner } from '@ember/application';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { debounce } from 'ember-resources/util/debounce';
import { use } from 'ember-resources/util/function-resource';

module('Utils | debounce | js', function (hooks) {
  setupTest(hooks);

  let someTime = (ms = 25) => new Promise((resolve) => setTimeout(resolve, ms));

  module('debounce', function () {
    test('works with @use', async function (assert) {
      class Test {
        @tracked data = '';

        @use text = debounce(100, () => this.data);
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.text, undefined);

      test.data = 'b';
      await someTime();
      assert.strictEqual(test.text, undefined);
      test.data = 'bo';
      await someTime();
      assert.strictEqual(test.text, undefined);
      test.data = 'boo';
      await someTime();
      assert.strictEqual(test.text, undefined);

      await someTime(110);
      assert.strictEqual(test.text, 'boo');

      test.data = 'boop';
      assert.strictEqual(test.text, 'boo');

      await someTime(110);
      assert.strictEqual(test.text, 'boop');
    });
  });
});
