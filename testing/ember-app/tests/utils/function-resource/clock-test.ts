import { tracked } from '@glimmer/tracking';
import { destroy } from '@ember/destroyable';
import { clearRender, find, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { dependencySatisfies, macroCondition } from '@embroider/macros';
import { resource, resourceFactory, use } from 'ember-resources';
import { TrackedObject } from 'tracked-built-ins';

module('Examples | resource | Clock', function (hooks) {
  let wait = (ms = 1_100) => new Promise((resolve) => setTimeout(resolve, ms));

  hooks.beforeEach(function (assert) {
    // timeout is too new for the types to know about
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    assert.timeout(3000);
  });

  // Wrapper functions are the only way to pass Args to a resource.
  const Clock = resourceFactory(({ start, locale = 'en-US' }) => {
    // For a persistent state across arg changes, `Resource` may be better`
    let time = new TrackedObject({ current: start });
    let formatter = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    return resource(({ on }) => {
      let interval = setInterval(() => {
        time.current = new Date();
      }, 1000);

      on.cleanup(() => clearInterval(interval));

      return () => formatter.format(time.current);
    });
  });

  module('js', function (hooks) {
    setupTest(hooks);

    test('works with @use', async function (assert) {
      class Test {
        @tracked locale = 'en-US';

        @use now = Clock(() => ({ locale: this.locale }));
      }

      let foo = new Test();

      let timeA = foo.now;

      await wait();

      let timeB = foo.now;

      assert.notStrictEqual(timeA, timeB, `${timeB} is 1s after ${timeA}`);

      destroy(foo);
      await settled();
      await wait();

      let timeLast = foo.now;

      assert.strictEqual(timeB, timeLast, 'after stopping the clock, time is frozen');
    });
  });

  module('rendering', function (hooks) {
    setupRenderingTest(hooks);

    test('a clock can keep time', async function (assert) {
      let steps: string[] = [];
      let step = (msg: string) => {
        steps.push(msg);
        assert.step(msg);
      };

      const clock = resource(({ on }) => {
        let time = new TrackedObject({ current: new Date() });
        let interval = setInterval(() => {
          time.current = new Date();
        }, 1000);

        step(`setup ${interval}`);

        on.cleanup(() => {
          step(`cleanup ${interval}`);
          clearInterval(interval);
        });

        let formatter = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false,
        });

        return () => formatter.format(time.current);
      });

      this.setProperties({ clock });

      await render(hbs`
        <time>{{this.clock}}</time>
      `);

      let textA = find('time')?.innerText;

      assert.ok(textA, textA);

      await wait();

      let textB = find('time')?.innerText;

      assert.ok(textB, textB);
      assert.notStrictEqual(textA, textB, `${textB} is 1s after ${textA}`);

      await wait();

      let textC = find('time')?.innerText;

      assert.ok(textC, textC);
      assert.notStrictEqual(textB, textC, `${textC} is 1s after ${textB}`);

      await clearRender();

      assert.verifySteps(steps);
      assert.strictEqual(steps.length, 2, 'no extra setup/cleanup occurs');
    });

    test('acceps arguments', async function (assert) {
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

      await wait();

      let textB = find('time')?.innerText;

      assert.ok(textB, textB);
      assert.notStrictEqual(textA, textB, `${textB} is 1s after ${textA}`);

      await wait();

      let textC = find('time')?.innerText;

      assert.ok(textC, textC);
      assert.notStrictEqual(textB, textC, `${textC} is 1s after ${textB}`);

      this.setProperties({ locale: 'en-CA' });
      await settled();

      assert.strictEqual(textA, find('time')?.innerText, 'Time is reset');
    });
  });
});
