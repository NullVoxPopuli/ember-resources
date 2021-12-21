import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { destroy, isDestroyed, isDestroying } from '@ember/destroyable';
import { click, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { timeout } from 'ember-concurrency';
import { trackedFunction } from 'ember-resources';

module('trackedFunction', function () {
  module('in js', function (hooks) {
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

      assert.strictEqual(foo.data.value, undefined);

      foo.data.value;
      await settled();

      foo.count = 2;
      foo.data.value;
      await settled();

      foo.count = 6;
      foo.data.value;
      destroy(foo); // this prevents a third run
      await settled();

      assert.verifySteps(['run 1, value: 1', 'run 2, value: 2']);
    });

    test('it works with sync functions', async function (assert) {
      class Test {
        @tracked count = 1;

        data = trackedFunction(this, (previous: number) => {
          return this.count * (previous || 1);
        });
      }

      let foo = new Test();

      assert.strictEqual(foo.data.value, undefined);
      await settled();

      assert.strictEqual(foo.data.value, 1);

      foo.count = 2;
      foo.data.value;
      await settled();

      assert.strictEqual(foo.data.value, 2);

      foo.count = 6;
      foo.data.value;
      await settled();

      assert.strictEqual(foo.data.value, 12);

      foo.count = 7;
      foo.data.value;
      await settled();

      assert.strictEqual(foo.data.value, 84);
    });

    test('it works with async functions', async function (assert) {
      class Test {
        @tracked count = 1;

        data = trackedFunction(this, async (previous: undefined | number) => {
          let count = this.count;

          // Pretend we're doing async work
          await Promise.resolve();

          return count * (previous || 1);
        });
      }

      let foo = new Test();

      assert.strictEqual(foo.data.value, undefined);

      foo.data.value;
      await settled();
      assert.strictEqual(foo.data.value, 1);

      foo.count = 2;
      foo.data.value;
      await settled();

      assert.strictEqual(foo.data.value, 2);

      foo.count = 6;
      foo.data.value;
      await settled();

      assert.strictEqual(foo.data.value, 12);
    });

    test('async functions can have a fallback/initial value', async function (assert) {
      let initialValue = -Infinity;

      class Test {
        @tracked count = 1;

        data = trackedFunction(this, initialValue, async () => {
          let count = this.count;

          // Pretend we're doing async work
          await Promise.resolve();

          return count;
        });
      }

      let foo = new Test();

      assert.strictEqual(foo.data.value, initialValue);

      foo.data.value;
      await settled();
      assert.strictEqual(foo.data.value, 1);

      foo.count = 2;
      foo.data.value;
      await settled();

      assert.strictEqual(foo.data.value, 2);
    });
  });

  module('in templates', function (hooks) {
    setupRenderingTest(hooks);

    test('it works', async function (assert) {
      class Test extends Component {
        @tracked count = 1;

        data = trackedFunction(this, (previous: number | undefined) => {
          return (previous || 1) * this.count;
        });
        increment = () => this.count++;
      }

      const TestComponent = setComponentTemplate(
        hbs`
            <out>{{this.data.value}}</out>
            <button type='button' {{on 'click' this.increment}}></button>`,
        Test
      );

      this.setProperties({ TestComponent });

      await render(hbs`<this.TestComponent />`);

      assert.dom('out').hasText('1');

      await click('button');

      assert.dom('out').hasText('2');
    });

    test('async functions update when the promise resolves', async function (assert) {
      class Test extends Component {
        @tracked multiplier = 1;

        increment = () => this.multiplier++;

        data = trackedFunction(this, async () => {
          let multiplier = this.multiplier;
          // tracked data consumed here directly does not entangle with the function (deliberately)
          // let { multiplier } = this;

          await new Promise((resolve) => setTimeout(resolve, 50));

          return 2 * multiplier;
        });
      }

      const TestComponent = setComponentTemplate(
        hbs`
            <out>{{this.data.value}}</out>
            <button type='button' {{on 'click' this.increment}}></button>
          `,
        Test
      );

      this.setProperties({ TestComponent });

      render(hbs`<this.TestComponent />`);

      await timeout(25);
      assert.dom('out').hasText('');

      await settled();
      // await timeout(30);
      // debugger;
      assert.dom('out').hasText('2');

      click('button');
      await timeout(25);
      assert.dom('out').hasText('2');

      await settled();
      // await timeout(30);
      assert.dom('out').hasText('4');
    });
  });
});
