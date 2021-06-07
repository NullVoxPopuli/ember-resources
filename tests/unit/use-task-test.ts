import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { restartableTask, timeout } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import { useTask } from 'ember-resources';

module('useTask', function () {
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

      assert.equal(foo.search.value, null);
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
          yield timeout(50);

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
