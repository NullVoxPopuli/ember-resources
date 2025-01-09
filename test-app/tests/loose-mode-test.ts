import { find, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

module('Loose mode', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    await render(hbs`
      {{! template-lint-disable no-curly-component-invocation }}
      <time>{{ clock }}</time>
    `);

    assert.dom('time').hasAnyText();

    let initialText = find('time')?.innerText?.trim();

    await new Promise((resolve) => setTimeout(resolve, 1100));

    assert.ok(initialText);
    assert.notStrictEqual(find('time')?.innerText?.trim(), initialText);
  });

  test('can be passed to a helper', async function (assert) {
    await render(hbs`
      <time>{{time-format (clock) }}</time>
    `);

    assert.dom('time').hasAnyText();

    let initialText = find('time')?.innerText?.trim();

    await new Promise((resolve) => setTimeout(resolve, 1100));

    assert.ok(initialText);
    assert.notStrictEqual(find('time')?.innerText?.trim(), initialText);
  });
});
