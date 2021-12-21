/* eslint-disable @typescript-eslint/no-explicit-any */
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { render, settled } from '@ember/test-helpers';
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

          assert.strictEqual(foo.search.value, null);
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

          assert.strictEqual(foo.search.value, null);
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

          assert.strictEqual(foo.search.value, null);
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

          assert.strictEqual(foo.search.value, null);
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
});
