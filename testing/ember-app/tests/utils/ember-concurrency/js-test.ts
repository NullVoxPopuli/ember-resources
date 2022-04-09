/* eslint-disable @typescript-eslint/no-explicit-any */
import { tracked } from '@glimmer/tracking';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { dependencySatisfies, importSync } from '@embroider/macros';
import { taskFor } from 'ember-concurrency-ts';
import { trackedTask } from 'ember-resources/util/ember-concurrency';

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

            search = trackedTask(this, taskFor(this._search), () => [this.input]);

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

            search = trackedTask(this, taskFor(this._search));

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

            search = trackedTask(this, taskFor(this._search), () => [this.input]);

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

            search = trackedTask(this, taskFor(this._search));

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
    });
  }
});
