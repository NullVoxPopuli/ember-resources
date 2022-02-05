/* eslint-disable @typescript-eslint/no-explicit-any */
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { render, settled, setupOnerror } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { dependencySatisfies, importSync } from '@embroider/macros';
import { taskFor } from 'ember-concurrency-ts';
import { useTask } from 'ember-resources';

module('useTask', function () {
  if (dependencySatisfies('ember-concurrency', '^2.0.0')) {
    module('ember-concurrency@v2', function () {
      interface EConcurrencyV2 {
        timeout: (wait: number) => Promise<void>;
        restartableTask: PropertyDecorator;
      }

      const { restartableTask, timeout } = importSync('ember-concurrency') as EConcurrencyV2;

      module('in JS', function (hooks) {
        setupTest(hooks);

        test('it works', async function (assert) {
          class Test {
            @tracked input = '';

            search = useTask(this, taskFor(this._search), () => [this.input]);

            @restartableTask
            *_search(input: string) {
              // or some bigger timeout for an actual search task to debounce
              yield timeout(0);

              // or some api data if actual search task
              return { results: [input] };
            }
          }

          let foo = new Test();

          // task is initiated upon first access
          foo.search;
          await settled();

          assert.strictEqual(foo.search.value, undefined);
          assert.false(foo.search.isFinished);
          assert.true(foo.search.isRunning);

          await settled();

          assert.true(foo.search.isFinished);
          assert.false(foo.search.isRunning);
          assert.deepEqual(foo.search.value, { results: [''] });

          foo.input = 'Hello there!';
          await settled();

          assert.deepEqual(foo.search.value, { results: [''] }, 'previous value is retained');
          assert.false(foo.search.isFinished);
          assert.true(foo.search.isRunning);

          await settled();

          assert.true(foo.search.isFinished);
          assert.false(foo.search.isRunning);
          assert.deepEqual(foo.search.value, { results: ['Hello there!'] });
        });

        test('it works without the thunk', async function (assert) {
          class Test {
            @tracked input = '';

            search = useTask(this, taskFor(this._search));

            @restartableTask
            *_search() {
              // NOTE: args must be consumed before the first yield
              let { input } = this;

              // or some bigger timeout for an actual search task to debounce
              yield timeout(0);

              // or some api data if actual search task
              return { results: [input] };
            }
          }

          let foo = new Test();

          // task is initiated upon first access
          foo.search;
          await settled();

          assert.strictEqual(foo.search.value, undefined);
          assert.false(foo.search.isFinished);
          assert.true(foo.search.isRunning);

          await settled();

          assert.true(foo.search.isFinished);
          assert.false(foo.search.isRunning);
          assert.deepEqual(foo.search.value, { results: [''] });

          foo.input = 'Hello there!';
          await settled();

          assert.deepEqual(foo.search.value, { results: [''] }, 'previous value is retained');
          assert.false(foo.search.isFinished);
          assert.true(foo.search.isRunning);

          await settled();

          assert.true(foo.search.isFinished);
          assert.false(foo.search.isRunning);
          assert.deepEqual(foo.search.value, { results: ['Hello there!'] });
        });
      });

      module('in templates', function (hooks) {
        setupRenderingTest(hooks);

        test('it works', async function (assert) {
          class Test extends Component {
            @tracked input = 'Hello there';

            search = useTask(this, this._search as any, () => [this.input]);

            @restartableTask
            *_search(input: string) {
              yield timeout(500);

              return input;
            }
          }

          const TestComponent = setComponentTemplate(hbs`{{yield this}}`, Test);

          this.setProperties({ TestComponent });

          render(hbs`
            <this.TestComponent as |ctx|>
              {{#if ctx.search.isRunning}}
                Loading
              {{else}}
                {{ctx.search.value}}
              {{/if}}
            </this.TestComponent>
          `);

          // This could introduce flakiness / timing issues
          await timeout(10);

          assert.dom().hasText('Loading');

          await settled();

          assert.dom().hasText('Hello there');
        });
      });
    });
  } else {
    module('ember-concurrency@v1', function () {
      interface EConcurrencyV2 {
        timeout: (wait: number) => Promise<void>;
        restartableTask: PropertyDecorator;
      }

      interface EConcurrencyDecorators {
        restartableTask: PropertyDecorator;
      }

      const { timeout } = importSync('ember-concurrency') as EConcurrencyV2;
      const { restartableTask } = importSync(
        'ember-concurrency-decorators'
      ) as EConcurrencyDecorators;

      module('in JS', function (hooks) {
        setupTest(hooks);

        test('it works', async function (assert) {
          class Test {
            @tracked input = '';

            search = useTask(this, taskFor(this._search), () => [this.input]);

            @restartableTask
            *_search(input: string) {
              // or some bigger timeout for an actual search task to debounce
              yield timeout(0);

              // or some api data if actual search task
              return { results: [input] };
            }
          }

          let foo = new Test();

          // task is initiated upon first access
          foo.search;
          await settled();

          assert.strictEqual(foo.search.value, undefined);
          assert.false(foo.search.isFinished);
          assert.true(foo.search.isRunning);

          await settled();

          assert.true(foo.search.isFinished);
          assert.false(foo.search.isRunning);
          assert.deepEqual(foo.search.value, { results: [''] });

          foo.input = 'Hello there!';
          await settled();

          assert.deepEqual(foo.search.value, { results: [''] }, 'previous value is retained');
          assert.false(foo.search.isFinished);
          assert.true(foo.search.isRunning);

          await settled();

          assert.true(foo.search.isFinished);
          assert.false(foo.search.isRunning);
          assert.deepEqual(foo.search.value, { results: ['Hello there!'] });
        });

        test('it works without the thunk', async function (assert) {
          class Test {
            @tracked input = '';

            search = useTask(this, taskFor(this._search));

            @restartableTask
            *_search() {
              // NOTE: args must be consumed before the first yield
              let { input } = this;

              // or some bigger timeout for an actual search task to debounce
              yield timeout(0);

              // or some api data if actual search task
              return { results: [input] };
            }
          }

          let foo = new Test();

          // task is initiated upon first access
          foo.search;
          await settled();

          assert.strictEqual(foo.search.value, undefined);
          assert.false(foo.search.isFinished);
          assert.true(foo.search.isRunning);

          await settled();

          assert.true(foo.search.isFinished);
          assert.false(foo.search.isRunning);
          assert.deepEqual(foo.search.value, { results: [''] });

          foo.input = 'Hello there!';
          await settled();

          assert.deepEqual(foo.search.value, { results: [''] }, 'previous value is retained');
          assert.false(foo.search.isFinished);
          assert.true(foo.search.isRunning);

          await settled();

          assert.true(foo.search.isFinished);
          assert.false(foo.search.isRunning);
          assert.deepEqual(foo.search.value, { results: ['Hello there!'] });
        });
      });

      module('in templates', function (hooks) {
        setupRenderingTest(hooks);

        test('it works', async function (assert) {
          class Test extends Component {
            @tracked input = 'Hello there';

            search = useTask(this, taskFor(this._search), () => [this.input]);

            @restartableTask
            *_search(input: string) {
              yield timeout(500);

              return input;
            }
          }

          const TestComponent = setComponentTemplate(hbs`{{yield this}}`, Test);

          this.setProperties({ TestComponent });

          render(hbs`
            <this.TestComponent as |ctx|>
              {{#if ctx.search.isRunning}}
                Loading
              {{else}}
                {{ctx.search.value}}
              {{/if}}
            </this.TestComponent>
          `);

          // This could introduce flakiness / timing issues
          await timeout(10);

          assert.dom().hasText('Loading');

          await settled();

          assert.dom().hasText('Hello there');
        });

        test('works when accessed via getter', async function (assert) {
          class Test extends Component {
            get colors() {
              return this.foundColors?.value ?? ['nothing to see here'];
            }

            foundColors = useTask(this, this.findColors as any);

            @restartableTask
            // eslint-disable-next-line require-yield
            *findColors() {
              return ['red', 'green', 'blue'];
            }
          }

          const TestComponent = setComponentTemplate(hbs`{{yield this}}`, Test);

          this.setProperties({ TestComponent });

          render(hbs`
            <this.TestComponent as |ctx|>
              {{ctx.colors}}
            </this.TestComponent>
          `);

          await settled();

          assert.dom().hasText('red,green,blue');
        });
      });
    });
  }

  let version;

  if (dependencySatisfies('ember-concurrency', '^2.0.0')) {
    version = '^2.0.0';
  } else if (dependencySatisfies('ember-concurrency', '^1.0.0')) {
    version = '^1.0.0';
  } else {
    version = 'unknown version';
  }

  module(`ember-concurrency's TaskInstance API :: ${version}`, function (hooks) {
    setupRenderingTest(hooks);

    let onError = window.onerror;

    hooks.beforeEach(function () {
      onError = window.onerror;
    });

    hooks.afterEach(function () {
      window.onerror = onError;
    });

    interface EConcurrencyV2 {
      timeout: (wait: number) => Promise<void>;
    }

    interface ECDecorators {
      restartableTask: PropertyDecorator;
    }

    let restartableTask: PropertyDecorator;

    if (dependencySatisfies('ember-concurrency', '^2.0.0')) {
      restartableTask = (importSync('ember-concurrency') as ECDecorators).restartableTask;
    } else {
      restartableTask = (importSync('ember-concurrency-decorators') as ECDecorators)
        .restartableTask;
    }

    const { timeout } = importSync('ember-concurrency') as EConcurrencyV2;

    test('error', async function (assert) {
      assert.expect(3);

      setupOnerror((error: any) => {
        assert.ok(
          error?.message?.includes('boop'),
          'Errors should be caught in the task and properly dealth with'
        );
      });

      class Test {
        search = useTask(this, taskFor(this._search));

        @restartableTask
        *_search() {
          yield timeout(100);

          throw new Error('boop');
        }
      }

      let ctx = new Test();

      this.setProperties({ ctx });

      render(hbs`{{this.ctx.search.error}}`);

      // This could introduce flakiness / timing issues
      await timeout(10);

      assert.dom().hasNoText();

      await settled();

      assert.dom().hasText('Error: boop');
    });

    test('hasStarted', async function (assert) {
      class Test {
        @tracked input = 'Hello there';

        search = useTask(this, taskFor(this._search), () => [this.input]);

        @restartableTask
        *_search(input: string) {
          yield timeout(100);

          return input;
        }
      }

      let ctx = new Test();

      this.setProperties({ ctx });

      render(hbs`{{this.ctx.search.hasStarted}}`);

      // This could introduce flakiness / timing issues
      await timeout(10);

      assert.dom().hasText('true');

      await settled();

      assert.dom().hasText('true');
    });

    test('isCanceled', async function (assert) {
      class Test {
        search = useTask(this, taskFor(this._search));

        @restartableTask
        *_search() {
          yield timeout(100);

          throw new Error('boop');
        }
      }

      let ctx = new Test();

      this.setProperties({ ctx });

      render(hbs`{{this.ctx.search.isCanceled}}`);

      // This could introduce flakiness / timing issues
      await timeout(10);

      assert.dom().hasText('false');

      ctx.search.cancel();

      await settled();

      assert.dom().hasText('true');
    });

    test('isError', async function (assert) {
      class Test {
        search = useTask(this, taskFor(this._search));

        @restartableTask
        *_search() {
          yield timeout(100);

          throw new Error('boop');
        }
      }

      let ctx = new Test();

      this.setProperties({ ctx });

      render(hbs`{{this.ctx.search.isError}}`);

      // This could introduce flakiness / timing issues
      await timeout(10);

      assert.dom().hasText('false');

      await settled();

      assert.dom().hasText('true');
    });

    test('isFinished', async function (assert) {
      class Test {
        @tracked input = 'Hello there';

        search = useTask(this, taskFor(this._search), () => [this.input]);

        @restartableTask
        *_search(input: string) {
          yield timeout(100);

          return input;
        }
      }

      let ctx = new Test();

      this.setProperties({ ctx });

      render(hbs`{{this.ctx.search.isFinished}}`);

      // This could introduce flakiness / timing issues
      await timeout(10);

      assert.dom().hasText('false');

      await settled();

      assert.dom().hasText('true');
    });

    test('isSuccessful', async function (assert) {
      class Test {
        @tracked input = 'Hello there';

        search = useTask(this, taskFor(this._search), () => [this.input]);

        @restartableTask
        *_search(input: string) {
          yield timeout(100);

          return input;
        }
      }

      let ctx = new Test();

      this.setProperties({ ctx });

      render(hbs`{{this.ctx.search.isSuccessful}}`);

      // This could introduce flakiness / timing issues
      await timeout(10);

      assert.dom().hasText('false');

      await settled();

      assert.dom().hasText('true');
    });

    test('value', async function (assert) {
      class Test {
        @tracked input = 'Hello there';

        search = useTask(this, taskFor(this._search), () => [this.input]);

        @restartableTask
        *_search(input: string) {
          yield timeout(100);

          return input;
        }
      }

      let ctx = new Test();

      this.setProperties({ ctx });

      render(hbs`{{this.ctx.search.value}}`);

      // This could introduce flakiness / timing issues
      await timeout(10);

      assert.dom().hasNoText();

      await settled();

      assert.dom().hasText('Hello there');
    });
  });
});
