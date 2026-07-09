import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell } from 'ember-resources';

module('Utils | cell | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    let state = cell<string | undefined>();

    await render(<template>{{state.current}}</template>);

    assert.dom().doesNotContainText('hello');

    state.current = 'hello';
    await settled();
    assert.dom().hasText('hello');
  });

  test('it works with an initial value', async function (assert) {
    let state = cell(0);

    await render(<template>{{state.current}}</template>);

    assert.dom().hasText('0');

    state.current++;
    await settled();

    assert.dom().hasText('1');
  });

  test('it can be updated via update / set', async function (assert) {
    let state = cell(0);

    await render(<template>{{state.current}}</template>);

    assert.dom().hasText('0');

    state.set(10);
    await settled();

    assert.dom().hasText('10');

    state.update((prev) => {
      return prev / 5;
    });
    await settled();
    assert.dom().hasText('2');
  });

  test('read() works the same as current', async function (assert) {
    let state = cell(0);

    await render(<template><div>{{(state.read)}}</div> - <div>{{state.current}}</div></template>);

    assert.dom().hasText('0 - 0');

    state.set(10);
    await settled();

    assert.dom().hasText('10 - 10');
  });

  test('placing a cell in vanilla {{ }} should automatically call .current', async function (assert) {
    let state = cell(0);

    await render(<template>{{state}}</template>);

    assert.dom().hasText('0');

    state.set(10);
    await settled();

    assert.dom().hasText('10');
  });
});
