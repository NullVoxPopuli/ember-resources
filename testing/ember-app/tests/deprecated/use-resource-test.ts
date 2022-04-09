/* eslint-disable @typescript-eslint/no-explicit-any */
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { destroy, isDestroyed, registerDestructor } from '@ember/destroyable';
import { click, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { LifecycleResource, Resource, useResource } from 'ember-resources';

import type { Positional } from 'ember-resources';

module('useResource', function () {
  module('LifecycleResource', function () {
    module('in JS', function (hooks) {
      setupTest(hooks);

      test('it works', async function (assert) {
        class Doubler extends LifecycleResource<Positional<[number]>> {
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

        assert.strictEqual(foo.data.num, 0);

        foo.count = 3;
        await settled();

        assert.strictEqual(foo.data.num, 6);

        foo.count = 4;
        await settled();

        assert.strictEqual(foo.data.num, 8);
      });

      test('destroyables are correct', async function (assert) {
        class Doubler extends LifecycleResource<Positional<[number]>> {
          constructor(owner: unknown, args: Positional<[number]>) {
            super(owner, args);

            registerDestructor(this, () => assert.step('destroyed'));
          }
        }

        class Test {
          @tracked count = 0;

          data = useResource(this, Doubler, () => [this.count]);
        }

        let foo = new Test();

        // Intentionally doesn't exist
        (foo.data as any).anything;

        assert.notOk(isDestroyed(foo), 'not destroyed');
        assert.verifySteps([]);

        destroy(foo);
        await settled();

        assert.ok(isDestroyed(foo), 'destroyed');
        assert.verifySteps(['destroyed']);
      });

      test('can take a typed array https://github.com/NullVoxPopuli/ember-resources/issues/48', async function (assert) {
        class DoubleEverything extends LifecycleResource<Positional<number[]>> {
          @tracked result: number[] = [];

          setup() {
            this.update();
          }

          update() {
            this.result = this.args.positional.map((num) => num * 2);
          }
        }
        class Test {
          @tracked numbers = [0, 1, 2, 3];

          data = useResource(this, DoubleEverything, () => [...this.numbers]);
        }

        let foo = new Test();

        await settled();
        assert.deepEqual(foo.data.result, [0, 2, 4, 6]);

        foo.numbers = [2, 6, 2, 7];
        await settled();
        assert.deepEqual(foo.data.result, [4, 12, 4, 14]);
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
        class Doubler extends LifecycleResource<Positional<[number]>> {
          get num() {
            return this.args.positional[0] * 2;
          }
        }

        class Test {
          @tracked count = 0;

          data = useResource(this, Doubler, () => [this.count]);
        }

        let foo = new Test();

        assert.strictEqual(foo.data.num, 0);

        foo.count = 3;
        await settled();

        assert.strictEqual(foo.data.num, 6);

        foo.count = 4;
        await settled();

        assert.strictEqual(foo.data.num, 8);
      });
    });

    test('does not need args', async function (assert) {
      class TestResource extends Resource {
        foo = 3;
      }

      class Test {
        dataArray = useResource(this, TestResource, () => []);
        dataVoid = useResource(this, TestResource, () => {});
        dataOmitted = useResource(this, TestResource);
      }

      let foo = new Test();

      assert.strictEqual(foo.dataArray.foo, 3);
      assert.strictEqual(foo.dataVoid.foo, 3);
      assert.strictEqual(foo.dataOmitted.foo, 3);
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

  module('Resource', function () {
    module('in JS', function (hooks) {
      setupTest(hooks);

      test('it works', async function (assert) {
        class Doubler<Args extends Positional<[number]>> extends Resource<Args> {
          @tracked num = 0;

          constructor(owner: unknown, args: Args, previous?: Doubler<Args>) {
            super(owner, args, previous);

            if (!previous) {
              this.num = this.args.positional[0] * 2;
            } else {
              this.num = this.args.positional[0] * 3;
            }
          }
        }
        class Test {
          @tracked count = 0;

          data = useResource(this, Doubler, () => [this.count]);
        }

        let foo = new Test();

        assert.strictEqual(foo.data.num, 0);

        foo.count = 3;
        await settled();

        assert.strictEqual(foo.data.num, 9);

        foo.count = 4;
        await settled();

        assert.strictEqual(foo.data.num, 12);
      });

      test('lifecycle', async function (assert) {
        class Doubler<Args extends Positional<[number]>> extends Resource<Args> {
          @tracked num = 0;

          constructor(owner: unknown, args: Args, previous?: Doubler<Args>) {
            super(owner, args, previous);

            if (!previous) {
              this.num = this.args.positional[0] * 2;
              assert.step(`resource:setup ${this.num}`);
            } else {
              this.num = this.args.positional[0] * 3;
              assert.step(`resource:update ${this.num}`);
            }

            registerDestructor(this, () => {
              assert.step(`resource:destroy ${this.num}`);
            });
          }
        }
        class Test {
          @tracked count = 0;

          data = useResource(this, Doubler, () => [this.count]);
        }

        let foo = new Test();

        foo.data.num;
        await settled();

        foo.count = 3;
        foo.data.num;
        await settled();

        foo.count = 4;
        foo.data.num;
        await settled();

        assert.verifySteps([
          'resource:setup 0',
          'resource:update 9',
          'resource:destroy 0',
          'resource:update 12',
          'resource:destroy 9',
        ]);
      });
    });
  });
});
