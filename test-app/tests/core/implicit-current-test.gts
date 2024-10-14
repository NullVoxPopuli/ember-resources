import { on } from '@ember/modifier';
import { click, render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell, resource, resourceFactory } from 'ember-resources';


module('.current and implicit .current', function (hooks) {
  setupRenderingTest(hooks);

  test('A resource has a current property', async function (assert) {
    let change = () => 0;
    const Now = resource(() => {
      const now = cell(0);

      change = () => now.current++;

      return now;
    });

    await render(
      <template>
        <out id="implicit">{{Now}}</out>
        <out id="explicit">{{Now.current}}</out>
      </template>
    );

    assert.dom('#implicit').hasText('0');
    assert.dom('explicit').hasText('0');

    change();
    await settled();

    assert.dom('#implicit').hasText('1');
    assert.dom('explicit').hasText('1');
  });
});
