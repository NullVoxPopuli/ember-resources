import { tracked } from '@glimmer/tracking';
import { setOwner } from '@ember/application';
import { helper } from '@ember/component/helper';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { useHelper } from 'ember-resources';

module('Helpers', function () {
  // not testing in template, because that's the easy part
  module('in js', function (hooks) {
    setupTest(hooks);

    test('it works', async function (assert) {
      class Test {
        @tracked count = 1;

        _doubler = helper(([num]) => num * 2);

        doubler = useHelper(this, this._doubler, () => [this.count]);
      }

      let foo = new Test();

      setOwner(foo, this.owner);

      assert.strictEqual(foo.doubler.value, 2);

      foo.count = 4;
      await settled();

      assert.strictEqual(foo.doubler.value, 8);
    });
  });
});
