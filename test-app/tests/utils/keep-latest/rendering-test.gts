import { tracked } from '@glimmer/tracking';
// @ts-ignore
import { fn, hash } from '@ember/helper';
import { module, test } from 'qunit';
import { render, settled } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';

import { trackedFunction } from 'ember-resources/util/function';
import { keepLatest } from 'ember-resources/util/keep-latest';

const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

module('Utils | keepLatest | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    class Test {
      @tracked x = 1;

      // @use request = trackedFunction(async () => {
      request = trackedFunction(this, async () => {
        let value = this.x;

        await timeout(30);

        return value;
      });
    }

    let instance = new Test();

    let passthrough = <T>(x: T) => x;

    render(<template>
      {{#let instance.request as |request|}}
        {{keepLatest (hash
          when=(fn passthrough request.isPending)
          value=(fn passthrough request.value)
        )}}
      {{/let}}
    </template>);

    await timeout(10);

    assert.dom().hasNoText();

    await settled();

    assert.dom().hasText('1');

    instance.x = 2;

    assert.dom().hasText('1');
    await timeout(15);
    assert.dom().hasText('1');
    await timeout(40);
    assert.dom().hasText('2');
  });
});
