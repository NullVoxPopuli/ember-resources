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

      test('setup is optional', async function (assert) {
        class Doubler extends LifecycleResource<{ positional: [number] }> {
          get num() {
            return this.args.positional[0] * 2;
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
});
