import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { Ref } from 'ember-resources/util/ref';
import { resource, cell } from 'ember-resources';

module('Utils | ref | rendering', function (hooks) {
  setupRenderingTest(hooks);

  let delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  test('it works', async function (assert) {
    let count = 0;
    let counter = Ref(({ on }) => {
      let interval = setInterval(() => {
        callback();
      }, 100);

      on.cleanup(() => clearInterval(interval));

      return () => count;
    });

    let showA = cell();
    let showB = cell();

    await render(<template>
      {{#if showA.current}}
        <div id="a">a: {{counter}}</div>
      {{/if}}

      {{#if showB.current}}
        <div id="b">b: {{counter}}</div>
      {{/if}}
    </template>);

    assert.dom().hasNoText();

    showA.current = true;
    await settled();
    assert.dom().hasText('a: 0');

    await delay(150);
    assert.dom().hasText('a: 1');

    showB.current = true;
    await settled();
    assert.dom().hasText('a: 1 b: 1');

    await delay(150);
    assert.dom().hasText('a: 2 b: 2');

    showA.current = false;
    await settled();
    assert.dom().hasText('b: 2');

    await delay(150);
    assert.dom().hasText('b: 3');

    showB.current = false;
    await settled();
    assert.dom().hasNoText();

    await delay(300);

    showB.current = true;
    await settled();
    // Does state need to be kept?
    assert.dom().hasText('b: 0');
  });
});
