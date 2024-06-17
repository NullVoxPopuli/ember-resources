import { render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell, resource, resourceFactory } from 'ember-resources';


module('issues/1134', function(hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    let value = cell(0);

    function Wrapper(arg: number) {
      assert.step(`wrapper: ${arg}`);

      return resource(({ on }) => {
        assert.step(`setup: ${arg}`);
        on.cleanup(() => assert.step(`cleanup: ${arg}`));

        return 0;
      });
    }

    resourceFactory(Wrapper);

    await render(<template>{{Wrapper value.current}}</template>);

    assert.verifySteps([]);
  });

});
