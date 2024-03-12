import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Loose mode', function (hbs) {
  test('it works', async function (assert) {
    await render(hbs`
      {{! have to wrap in () because there are no args }}
      <time>{{ (clock) }}</time>
    `);

    assert.dom('time').hasText();
    let initialText = find('time').innerText;

    await new Promise(resolve => setTimeout(resolve, 1100));

    assert.notStrictEqual(find('time').innerText, initialText);
  });
});
