import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { destroy } from '@ember/destroyable';
import { click, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { LifecycleResource, useResource } from 'ember-resources';

module('useResource', function () {
  module('LifecycleResource', function () {
    module('in JS', function (hooks) {
      setupTest(hooks);

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

        foo.count = 4;
        await settled();

        assert.equal(foo.data.num, 8);
      });

      test('lifecycle', async function (assert) {
        class Doubler extends LifecycleResource<{ positional: [number] }> {
          @tracked num = 0;

          setup() {
            assert.step('setup');
            this.num = this.args.positional[0] * 2;
          }

          update() {
            assert.step('update');
            this.num = this.args.positional[0] * 2;
          }

          teardown() {
            assert.step('teardown');
          }
        }
        class Test {
          @tracked count = 0;

          data = useResource(this, Doubler, () => [this.count]);
        }

        let foo = new Test();

        foo.data.num;
        foo.count = 4;
        foo.data.num;
        await settled();
        foo.count = 5;
        foo.data.num;
        await settled();

        destroy(foo);
        await settled();

        assert.verifySteps(['setup', 'update', 'update', 'teardown']);
      });
    });

    module('in templates', function (hooks) {
      setupRenderingTest(hooks);

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
        class Test extends Component {
          @tracked count = 0;

          data = useResource(this, Doubler, () => [this.count]);
          increment = () => this.count++;
        }

        const TestComponent = setComponentTemplate(
          hbs`
            <out>{{this.data.num}}</out>
            <button type='button' {{on 'click' this.increment}}>increment</button>`,
          Test
        );

        this.setProperties({ TestComponent });

        await render(hbs`<this.TestComponent />`);

        assert.dom('out').hasText('0');

        await click('button');

        assert.dom('out').hasText('2');
      });
    });
  });

  module('functions', function () {
    module('in js', function (hooks) {
      setupTest(hooks);

      test('lifecycle', async function (assert) {
        let runCount = 0;

        class Test {
          @tracked count = 1;

          data = useResource(
            this,
            async () => {
              runCount++;
              // Pretend we're doing async work
              await Promise.resolve();

              assert.step(`run ${runCount}`);
            },
            () => [this.count]
          );
        }

        let foo = new Test();

        assert.equal(foo.data.value, undefined);

        foo.data.value;
        await settled();
        foo.count = 2;
        foo.data.value;
        await settled();
        foo.count = 6;
        foo.data.value;
        destroy(foo);
        await settled();

        assert.verifySteps(['run 1', 'run 2', 'run 3']);
      });

      test('it works with sync functions', async function (assert) {
        class Test {
          @tracked count = 1;

          data = useResource(
            this,
            (previous: number, count: number) => count * (previous || 1),
            () => [this.count]
          );
        }

        let foo = new Test();

        assert.equal(foo.data.value, 1);

        foo.count = 2;
        await settled();

        assert.equal(foo.data.value, 2);

        foo.count = 6;
        await settled();

        assert.equal(foo.data.value, 12);
      });

      test('it works with async functions', async function (assert) {
        class Test {
          @tracked count = 1;

          data = useResource(
            this,
            async (previous: undefined | number, count: number) => {
              // Pretend we're doing async work
              await Promise.resolve();

              return count * (previous || 1);
            },
            () => [this.count]
          );
        }

        let foo = new Test();

        assert.equal(foo.data.value, undefined);

        foo.data.value;
        await settled();
        assert.equal(foo.data.value, 1);

        foo.count = 2;
        foo.data.value;
        await settled();

        assert.equal(foo.data.value, 2);

        foo.count = 6;
        foo.data.value;
        await settled();

        assert.equal(foo.data.value, 12);
      });
    });

    module('in templates', function (hooks) {
      setupRenderingTest(hooks);

      test('it works', async function (assert) {
        class Test extends Component {
          @tracked count = 1;

          data = useResource(
            this,
            (previous: number | undefined, count: number) => {
              return (previous || 1) * count;
            },
            () => [this.count]
          );
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

      test('it works without a thunk', async function (assert) {
        class Test extends Component {
          @tracked count = 1;

          doubled = useResource(this, () => this.count * 2);
          increment = () => this.count++;
        }

        const TestComponent = setComponentTemplate(
          hbs`
            <out>{{this.doubled.value}}</out>
            <button type='button' {{on 'click' this.increment}}></button>`,
          Test
        );

        this.setProperties({ TestComponent });

        await render(hbs`<this.TestComponent />`);

        assert.dom('out').hasText('2');

        await click('button');

        assert.dom('out').hasText('4');
      });
    });
  });
});
