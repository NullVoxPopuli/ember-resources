import { tracked } from '@glimmer/tracking';
import { getOwner, setOwner } from '@ember/application';
import { destroy } from '@ember/destroyable';
import Service from '@ember/service';
import { clearRender, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { resource, use } from 'ember-resources';

module('Utils | resource | rendering', function (hooks) {
  setupRenderingTest(hooks);

  module('lifecycle', function () {
    module('direct rendering', function () {
      test('when consuming tracked data', async function (assert) {
        class Test {
          @tracked num = 0;
        }

        let foo = new Test();
        // reminder that destruction is async
        let steps: string[] = [];
        let step = (msg: string) => {
          steps.push(msg);
          assert.step(msg);
        };

        this.setProperties({
          theResource: resource(({ on }) => {
            let num = foo.num;

            on.cleanup(() => step(`destroy ${num}`));

            step(`resolve ${num}`);

            return num;
          }),
        });

        await render(hbs`
          {{#let (this.theResource) as |value|}}
            <out>{{value}}</out>
          {{/let}}
        `);

        assert.dom('out').containsText('0');

        foo.num = 2;
        await settled();

        assert.dom('out').containsText('2');

        foo.num = 7;
        await settled();

        assert.dom('out').containsText('7');

        await clearRender();
        destroy(foo);
        await settled();

        assert.verifySteps(steps);
      });

      test('with separate tracking frame', async function (assert) {
        class Test {
          @tracked num = 0;
        }

        let foo = new Test();
        // reminder that destruction is async
        let steps: string[] = [];
        let step = (msg: string) => {
          steps.push(msg);
          assert.step(msg);
        };

        this.setProperties({
          theResource: resource(({ on }) => {
            on.cleanup(() => step(`destroy`));

            step(`setup`);

            return () => {
              step(`computing ${foo.num}`);

              return foo.num;
            };
          }),
        });

        await render(hbs`<out>{{this.theResource}}</out>`);

        assert.dom('out').containsText('0');

        foo.num = 2;
        await settled();

        assert.dom('out').containsText('2');

        foo.num = 7;
        await settled();

        assert.dom('out').containsText('7');

        await clearRender();
        destroy(foo);
        await settled();

        assert.verifySteps(steps);
        assert.strictEqual(steps.length, 5, 'setup + computing 3 times + destroy');
      });

      test('when gated by an if', async function (assert) {
        class Test {
          @tracked show = true;
        }

        let inc = 0;
        let foo = new Test();

        this.setProperties({
          foo,
          theResource: resource(({ on }) => {
            let i = inc;

            on.cleanup(() => assert.step(`destroy ${i}`));

            assert.step(`resolve ${i}`);

            return 'a value!';
          }),
        });

        await render(hbs`
          {{#if this.foo.show}}
            {{#let (this.theResource) as |value|}}
              <out>{{value}}</out>
            {{/let}}
          {{/if}}
        `);

        assert.dom('out').exists();

        foo.show = false;
        inc++;
        await settled();

        assert.dom('out').doesNotExist();

        foo.show = true;
        inc++;
        await settled();

        assert.dom('out').exists();

        await clearRender();

        assert.verifySteps(
          ['resolve 0', 'destroy 0', 'resolve 2', 'destroy 2'],
          `index 1 is skipped, because the resource was not invoked`
        );
      });

      test('when gated by an if and conusming tracked data', async function (assert) {
        class Test {
          @tracked show = true;
          @tracked num = 0;
        }

        let foo = new Test();

        this.setProperties({
          foo,
          theResource: resource(({ on }) => {
            let i = foo.num;

            on.cleanup(() => assert.step(`destroy ${i}`));

            assert.step(`resolve ${i}`);

            return 'a value!';
          }),
        });

        await render(hbs`
          {{#if this.foo.show}}
            {{#let (this.theResource) as |value|}}
              <out>{{value}}</out>
            {{/let}}
          {{/if}}
        `);

        assert.dom('out').exists();

        foo.show = false;
        foo.num++;
        await settled();

        assert.dom('out').doesNotExist();

        foo.num++;
        foo.show = true;
        await settled();

        assert.dom('out').exists();

        await clearRender();

        assert.verifySteps(
          ['resolve 0', 'destroy 0', 'resolve 2', 'destroy 2'],
          'index 1 is skipped, because the resource is not rendered'
        );
      });

      test('when gated by and receiving an argument', async function (assert) {
        class Test {
          @tracked show = true;
          @tracked num = 0;
        }

        let foo = new Test();

        this.setProperties({
          foo,
          theResource: resource(({ on }) => {
            let i = foo.num;

            on.cleanup(() => assert.step(`destroy ${i}`));

            assert.step(`resolve ${i}`);

            return 'a value!';
          }),
        });

        await render(hbs`
          {{#if this.foo.show}}
            {{#let (this.theResource this.foo.num) as |value|}}
              <out>{{value}}</out>
            {{/let}}
          {{/if}}
        `);

        assert.dom('out').exists();

        foo.num++;
        foo.show = false;
        await settled();

        assert.dom('out').doesNotExist();

        foo.num++;
        foo.show = true;
        await settled();

        assert.dom('out').exists();

        await clearRender();

        assert.verifySteps(
          ['resolve 0', 'destroy 0', 'resolve 2', 'destroy 2'],
          'resources do not take arguments, so they would not be invalidated -- but hiding and showing still re-mounts and destroys the resource'
        );
      });
    });

    module('with @use in a class', function () {
      test('when consuming tracked data', async function (assert) {
        // reminder that destruction is async
        let steps: string[] = [];
        let step = (msg: string) => {
          steps.push(msg);
          assert.step(msg);
        };

        class Test {
          @tracked num = 0;
          @use theResource = resource(({ on }) => {
            let num = this.num;

            on.cleanup(() => step(`destroy ${num}`));

            step(`resolve ${num}`);

            return num;
          });
        }

        let foo = new Test();

        this.setProperties({
          foo,
        });

        await render(hbs`
          <out>{{this.foo.theResource}}</out>
        `);

        assert.dom('out').containsText('0');

        foo.num = 2;
        await settled();

        assert.dom('out').containsText('2');

        foo.num = 7;
        await settled();

        assert.dom('out').containsText('7');

        await clearRender();

        assert.verifySteps(steps);

        destroy(foo);
        await settled();

        assert.verifySteps(['destroy 7']);
      });

      test('when gated by an if', async function (assert) {
        let inc = 0;

        class Test {
          @tracked show = true;

          @use theResource = resource(({ on }) => {
            let i = inc;

            on.cleanup(() => assert.step(`destroy ${i}`));

            assert.step(`resolve ${i}`);

            return 'a value!';
          });
        }

        let foo = new Test();

        this.setProperties({
          foo,
        });

        await render(hbs`
          {{#if this.foo.show}}
            <out>{{this.foo.theResource}}</out>
          {{/if}}
        `);

        assert.dom('out').exists();

        foo.show = false;
        inc++;
        await settled();

        assert.dom('out').doesNotExist();

        foo.show = true;
        inc++;
        await settled();

        assert.dom('out').exists();

        assert.verifySteps(
          ['resolve 0'],
          `index 1  and 2 are skipped, because the resource was not invoked with tracked data`
        );

        await clearRender();
        destroy(foo);
        await settled();

        assert.verifySteps(['destroy 0']);
      });

      test('when gated by an if and conusming tracked data', async function (assert) {
        // reminder that destruction is async
        let steps: string[] = [];
        let step = (msg: string) => {
          steps.push(msg);
          assert.step(msg);
        };

        class Test {
          @tracked show = true;
          @tracked num = 0;
          @use theResource = resource(({ on }) => {
            let i = foo.num;

            on.cleanup(() => step(`destroy ${i}`));

            step(`resolve ${i}`);

            return 'a value!';
          });
        }

        let foo = new Test();

        this.setProperties({
          foo,
        });

        await render(hbs`
          {{#if this.foo.show}}
            <out>{{this.foo.theResource}}</out>
          {{/if}}
        `);

        assert.dom('out').exists();

        foo.show = false;
        foo.num++;
        await settled();

        assert.dom('out').doesNotExist();

        foo.num++;
        foo.show = true;
        await settled();

        assert.dom('out').exists();

        await clearRender();
        assert.verifySteps(steps, 'index 1 is skipped, because the resource is not rendered');

        destroy(foo);
        await settled();

        assert.verifySteps(['destroy 2']);
      });
    });
  });

  module('persistent state', function () {});

  module('with a wrapper', function () {
    test('lifecycle', async function (assert) {
      const Wrapper = (initial: number) => {
        return resource(({ on }) => {
          on.cleanup(() => assert.step(`destroy ${initial}`));

          assert.step(`resolve ${initial}`);

          return initial + 1;
        });
      };

      class Test {
        @tracked num = 0;
      }

      let foo = new Test();

      this.setProperties({ Wrapper, foo });

      await render(hbs`
        {{#let (this.Wrapper this.foo.num) as |state|}}
          <out>{{state}}</out>
        {{/let}}
      `);

      assert.dom('out').containsText('1');

      foo.num = 2;
      await settled();

      assert.dom('out').containsText('3');

      foo.num = 7;
      await settled();

      assert.dom('out').containsText('8');

      await clearRender();

      /**
       * As a reminder, destruction is async
       */
      assert.verifySteps([
        'resolve 0',
        'resolve 2',
        'destroy 0',
        'resolve 7',
        'destroy 2',
        'destroy 7',
      ]);
    });
  });

  module('with owner', function (hooks) {
    class Test {
      // @use is required if a primitive is returned
      @use data = resource(() => {
        const test = (getOwner(this) as Owner).lookup('service:test');

        return test.count;
      });
    }

    class TestService extends Service {
      @tracked count = 1;
    }

    hooks.beforeEach(function () {
      this.owner.register('service:test', TestService);
    });

    test('basics', async function (assert) {
      const testService = this.owner.lookup('service:test') as TestService;

      let test = new Test();

      setOwner(test, this.owner);

      this.set('test', test);

      await render(hbs`
        <out>{{this.test.data}}</out>
      `);

      assert.dom('out').containsText('1');

      testService.count = 2;
      await settled();

      assert.dom('out').containsText('2');
    });
  });
});
