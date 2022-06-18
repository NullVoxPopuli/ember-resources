import { tracked } from '@glimmer/tracking';
import { destroy } from '@ember/destroyable';
import { clearRender, find, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { dependencySatisfies, macroCondition } from '@embroider/macros';
import { resource, resourceFactory, use } from 'ember-resources/util/function-resource';
import { TrackedObject } from 'tracked-built-ins';

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

  module('persistent state', function () {
    test('a clock can keep time', async function (assert) {
      // timeout is too new for the types to know about
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      assert.timeout(3000);

      const clock = resource(({ on }) => {
        let time = new TrackedObject({ current: new Date() });
        let interval = setInterval(() => {
          time.current = new Date();
        }, 1000);

        on.cleanup(() => clearInterval(interval));

        let now = time.current;

        return new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false,
        }).format(now);
      });

      this.setProperties({ clock });

      await render(hbs`
        <time>{{this.clock}}</time>
      `);

      let textA = find('time')?.innerText;

      assert.ok(textA, textA);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      let textB = find('time')?.innerText;

      assert.ok(textB, textB);
      assert.notStrictEqual(textA, textB, `${textB} is 1s after ${textA}`);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      let textC = find('time')?.innerText;

      assert.ok(textC, textC);
      assert.notStrictEqual(textB, textC, `${textC} is 1s after ${textB}`);
    });
  });

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

    module('persistent state', function () {
      test('a Clock can keep time', async function (assert) {
        // timeout is too new for the types to know about
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        assert.timeout(3000);

        // Wrapper functions are the only way to pass Args to a resource.
        const Clock = resourceFactory(({ start, locale = 'en-US' }) => {
          // For a persistent state across arg changes, `Resource` may be better`
          let time = new TrackedObject({ current: start });

          return resource(({ on }) => {
            let interval = setInterval(() => {
              time.current = new Date();
            }, 1000);

            on.cleanup(() => clearInterval(interval));

            return new Intl.DateTimeFormat(locale, {
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              hour12: false,
            }).format(time.current);
          });
        });

        this.setProperties({ Clock, date: new Date(), locale: 'en-US' });

        /**
         * Older ember had a bug where nested helpers were not invoked
         * when using a dynamic helper (this.Clock)
         */
        if (macroCondition(dependencySatisfies('ember-source', '~3.25.0 || ~3.26.0'))) {
          await render(hbs`
            <time>
              {{#let (hash start=this.date locale=this.locale) as |options|}}
                {{this.Clock options}}
              {{/let}}
            </time>
          `);
        } else {
          await render(hbs`
            <time>{{this.Clock (hash start=this.date locale=this.locale)}}</time>
          `);
        }

        let textA = find('time')?.innerText;

        assert.ok(textA, textA);

        await new Promise((resolve) => setTimeout(resolve, 1100));

        let textB = find('time')?.innerText;

        assert.ok(textB, textB);
        assert.notStrictEqual(textA, textB, `${textB} is 1s after ${textA}`);

        await new Promise((resolve) => setTimeout(resolve, 1100));

        let textC = find('time')?.innerText;

        assert.ok(textC, textC);
        assert.notStrictEqual(textB, textC, `${textC} is 1s after ${textB}`);

        this.setProperties({ locale: 'en-CA' });
        await settled();

        assert.strictEqual(textA, find('time')?.innerText, 'Time is reset');
      });
    });
  });
});
