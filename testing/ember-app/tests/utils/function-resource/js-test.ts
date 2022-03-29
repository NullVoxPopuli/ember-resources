import { tracked } from '@glimmer/tracking';
import { destroy } from '@ember/destroyable';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { resource, use } from 'ember-resources/util/function-resource';

import type QUnit from 'qunit';

module('Utils | resource | js', function (hooks) {
  setupTest(hooks);

  module('with teardown', function () {
    class Test {
      constructor(private assert: QUnit['assert']) {}

      @tracked count = 1;

      // @use is required if a primitive is returned
      @use data = resource(({ on }) => {
        let count = this.count;

        on.cleanup(() => this.assert.step(`destroy ${count}`));

        this.assert.step(`resolved ${count}`);

        return this.count;
      });
    }

    test('basics', async function (assert) {
      let foo = new Test(assert);

      assert.strictEqual(foo.data, 1);

      destroy(foo);
      await settled();

      assert.verifySteps(['resolved 1', 'destroy 1']);
    });

    test('reactivity', async function (assert) {
      let foo = new Test(assert);

      assert.strictEqual(foo.data, 1);

      foo.count = 2;

      assert.strictEqual(foo.data, 2);

      foo.count = 3;

      assert.strictEqual(foo.data, 3);

      destroy(foo);
      await settled();

      assert.verifySteps([
        'resolved 1',
        'destroy 1',
        'resolved 2',
        'destroy 2',
        'resolved 3',
        'destroy 3',
      ]);
    });

    test('async reactivity', async function (assert) {
      let foo = new Test(assert);

      assert.strictEqual(foo.data, 1);

      foo.count = 2;
      await settled();

      assert.strictEqual(foo.data, 2);

      foo.count = 3;
      await settled();

      assert.strictEqual(foo.data, 3);
      await settled();

      destroy(foo);
      await settled();

      assert.verifySteps([
        'resolved 1',
        'destroy 1',
        'resolved 2',
        'destroy 2',
        'resolved 3',
        'destroy 3',
      ]);
    });
  });

  module('with no teardown', function () {
    class Test {
      constructor(private assert: QUnit['assert']) {}

      @tracked count = 1;

      // @use is required if a primitive is returned
      @use data = resource(() => {
        let count = this.count;

        this.assert.step(`resolved ${count}`);

        return this.count;
      });
    }

    test('basics', async function (assert) {
      let foo = new Test(assert);

      assert.strictEqual(foo.data, 1);

      destroy(foo);
      await settled();

      assert.verifySteps(['resolved 1']);
    });

    test('reactivity', async function (assert) {
      let foo = new Test(assert);

      assert.strictEqual(foo.data, 1);

      foo.count = 2;

      assert.strictEqual(foo.data, 2);

      foo.count = 3;

      assert.strictEqual(foo.data, 3);

      destroy(foo);
      await settled();

      assert.verifySteps(['resolved 1', 'resolved 2', 'resolved 3']);
    });

    test('async reactivity', async function (assert) {
      let foo = new Test(assert);

      assert.strictEqual(foo.data, 1);

      foo.count = 2;
      await settled();

      assert.strictEqual(foo.data, 2);

      foo.count = 3;
      await settled();

      assert.strictEqual(foo.data, 3);
      await settled();

      destroy(foo);
      await settled();

      assert.verifySteps(['resolved 1', 'resolved 2', 'resolved 3']);
    });
  });
});
