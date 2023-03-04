import { tracked } from '@glimmer/tracking';
import { setOwner } from '@ember/application';
import { helper as emberHelper } from '@ember/component/helper';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { helper } from 'ember-resources/util/helper';

// not testing in template, because that's the easy part
module('Utils | helper | js', function (hooks) {
  setupTest(hooks);

  test('it works', async function (assert) {
    class Test {
      @tracked count = 1;

      _doubler = emberHelper(([num]: number[]) => (num ? num * 2 : num));

      doubler = helper(this, this._doubler, () => [this.count]);
    }

    let foo = new Test();

    setOwner(foo, this.owner);

    assert.strictEqual(foo.doubler.value, 2);

    foo.count = 4;
    await settled();

    assert.strictEqual(foo.doubler.value, 8);
  });
});
