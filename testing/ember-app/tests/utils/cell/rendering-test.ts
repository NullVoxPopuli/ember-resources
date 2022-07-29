import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell } from 'ember-resources';

module('Utils | cell | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    let state = cell();

    this.setProperties({ state });

    await render(hbs`{{this.state.current}}`);

    assert.dom().doesNotContainText('hello');

    state.current = 'hello';

    await settled();

    assert.dom().hasText('hello');
  });
});
