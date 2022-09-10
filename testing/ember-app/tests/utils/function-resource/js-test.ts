import { tracked } from '@glimmer/tracking';
import { setOwner } from '@ember/application';
import { destroy } from '@ember/destroyable';
import Service from '@ember/service';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { resource, use } from 'ember-resources';

import type QUnit from 'qunit';

module('Utils | resource | js', function (hooks) {
  setupTest(hooks);

  module('with teardown', function () {
    class Test {
      constructor(private assert: QUnit['assert']) {}
      // reminder that destruction is async
      steps: string[] = [];
      step = (msg: string) => {
        this.steps.push(msg);
        this.assert.step(msg);
      };

      @tracked count = 1;

      // @use is required if a primitive is returned
      @use data = resource(({ on }) => {
        let count = this.count;

        on.cleanup(() => this.step(`destroy ${count}`));

        this.step(`resolved ${count}`);

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

      let steps = foo.steps;

      assert.verifySteps(steps);

      assert.strictEqual(steps.length, 6);
      assert.strictEqual(
        steps.filter((s) => s.includes('resolve')).length,
        3,
        'resource resolved 3 times'
      );
      assert.strictEqual(
        steps.filter((s) => s.includes('resolve')).length,
        3,
        'resource destroyed 3 times'
      );
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

      let steps = foo.steps;

      assert.verifySteps(steps);

      assert.strictEqual(steps.length, 6);
      assert.strictEqual(
        steps.filter((s) => s.includes('resolve')).length,
        3,
        'resource resolved 3 times'
      );
      assert.strictEqual(
        steps.filter((s) => s.includes('destroy')).length,
        3,
        'resource destroyed 3 times'
      );
    });

    test('with separate tracking frame', async function (assert) {
      class Test {
        constructor(private assert: QUnit['assert']) {}
        // reminder that destruction is async
        steps: string[] = [];
        step = (msg: string) => {
          this.steps.push(msg);
          this.assert.step(msg);
        };

        @tracked outerCount = 1;
        @tracked count = 1;

        // @use is required if a primitive is returned
        @use data = resource(({ on }) => {
          let outerCount = this.outerCount;

          on.cleanup(() => this.step(`destroy ${outerCount}`));

          this.step(`setup ${outerCount}`);

          return () => {
            this.step(`resolved ${outerCount}: ${this.count}`);

            return this.count;
          };
        });
      }

      let foo = new Test(assert);

      assert.strictEqual(foo.data, 1);

      foo.count = 2;
      await settled();

      foo.outerCount++;
      await settled();

      assert.strictEqual(foo.data, 2);

      foo.count = 3;
      await settled();

      assert.strictEqual(foo.data, 3);
      await settled();

      destroy(foo);
      await settled();

      let steps = foo.steps;

      assert.verifySteps(steps);

      assert.strictEqual(steps.length, 7);
      assert.strictEqual(
        steps.filter((s) => s.includes('setup')).length,
        2,
        'resource setup 2 times'
      );
      assert.strictEqual(
        steps.filter((s) => s.includes('destroy')).length,
        2,
        'resource destroyed 3 times'
      );
      assert.strictEqual(
        steps.filter((s) => s.includes('resolve')).length,
        3,
        'resource resolved 3 times'
      );
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

  module('with owner', function (hooks) {
    class TestService extends Service {
      @tracked count = 1;
    }

    class Test {
      // @use is required if a primitive is returned
      @use data = resource(({ owner }) => {
        const test = owner.lookup('service:test') as TestService;

        return test.count;
      });
    }

    hooks.beforeEach(function () {
      this.owner.register('service:test', TestService);
    });

    test('basics', function (assert) {
      const testService = this.owner.lookup('service:test') as TestService;

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.data, 1);

      testService.count = 2;

      assert.strictEqual(test.data, 2);
    });
  });
});
