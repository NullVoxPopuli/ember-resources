// @ts-ignore @ember/modifier does not provide types :(
import { on } from '@ember/modifier';
import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell, resource, resourceFactory } from 'ember-resources';

module('Core | Resource | rendering', function (hooks) {
  setupRenderingTest(hooks);

  module('cleanup with wrapping factory/blueprint', function() {
    test('a generated interval can be cleared', async function (assert) {
      const id = cell(0);
      const condition = cell(true);

      const poll = resourceFactory((id: number) => {
        return resource(({ on }) => {
          assert.step(`setup: ${id}`);
          on.cleanup(() => assert.step(`cleanup: ${id}`));

          return id;
        });
      });

      await render(
        <template>
          <button type="button" {{on 'click' condition.toggle}}>Toggle</button><br />

          {{#if condition.current}}
            {{poll id.current}}
          {{/if}}
        </template>
      );

      assert.verifySteps(['setup: 0']);

      await click('button');

      assert.verifySteps(['cleanup: 0']);

      id.current++;
      await click('button');

      assert.verifySteps(['setup: 1']);

      await click('button');

      assert.verifySteps(['cleanup: 1']);
    });
  });
});
