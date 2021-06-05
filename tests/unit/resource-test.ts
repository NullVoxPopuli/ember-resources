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
    });
  });
});
