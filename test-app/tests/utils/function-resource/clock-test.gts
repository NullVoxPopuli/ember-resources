import { tracked } from '@glimmer/tracking';
import { destroy } from '@ember/destroyable';
// @ts-ignore
import { hash } from '@ember/helper';
import { clearRender, find, render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { cell, resource, resourceFactory, use } from 'ember-resources';

module('Examples | resource | Clock', function (hooks) {
  let wait = (ms = 1_100) => new Promise((resolve) => setTimeout(resolve, ms));

  hooks.beforeEach(function (assert) {
    assert.timeout(3000);
  });

  interface ClockArgs {
    start?: Date;
    locale?: string;
  }

  // Wrapper functions are the only way to pass Args to a resource.
  const Clock = resourceFactory((options: ClockArgs | (() => ClockArgs)) => {
    let opts = (typeof options === 'function') ? options() : options;
    let start = opts.start;
    let locale = opts.locale ?? 'en-US';

    // For a persistent state across arg changes, `Resource` may be better`
    let time = cell(start);
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
        let time = cell(new Date());
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

      await render(
        <template>
          <time>{{clock}}</time>
        </template>
      );

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
      class Test {
        @tracked date = new Date();
        @tracked locale = 'en-US';
      }

      let instance = new Test();

      await render(<template>
        <time>{{Clock (hash start=instance.date locale=instance.locale)}}</time>
      </template>);

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

      instance.locale = 'en-CA';
      await settled();

      let textD = find('time')?.innerText;

      assert.strictEqual(textD, textA, 'Time is reset');

      instance.date = new Date();
      await settled();

      let textE = find('time')?.innerText;

      assert.notStrictEqual(textE, textD, 'Time has changed');
    });
  });
});
