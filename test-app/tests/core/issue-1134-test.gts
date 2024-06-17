import { clearRender,render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell, resource, resourceFactory } from 'ember-resources';


module('issues/1134', function(hooks) {
  setupRenderingTest(hooks);

  test('it works as a vanilla resource', async function (assert) {
    let value = cell(0);

      const Data = resource(({ on }) => {
      let arg = value.current;

        assert.step(`setup: ${arg}`);
        on.cleanup(() => assert.step(`cleanup: ${arg}`));

        return 0;
      });

    await render(<template>{{Data}}</template>);

    assert.verifySteps(['setup: 0']);

    value.current = 1;
    await settled();
    assert.verifySteps(['setup: 1', 'cleanup: 0']);

    await clearRender();
    assert.verifySteps([`cleanup: ${value.current}`]);

  });

  test('it works with a Wrapper (resourceFactory)', async function (assert) {
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

    assert.verifySteps(['wrapper: 0', 'setup: 0']);

    value.current = 1;
    await settled();
    assert.verifySteps(['cleanup: 0', 'wrapper: 1', 'setup: 1']);

    await clearRender();
    assert.verifySteps([`cleanup: ${value.current}`]);
  });

});
