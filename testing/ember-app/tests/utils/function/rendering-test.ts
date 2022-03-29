import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { click, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { timeout } from 'ember-concurrency';
import { trackedFunction } from 'ember-resources/util/function';

module('Utils | trackedFunction | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    class Test extends Component {
      @tracked count = 1;

      data = trackedFunction(this, () => {
        return this.count;
      });
      increment = () => this.count++;
    }

    const TestComponent = setComponentTemplate(
      hbs`
        <out>{{this.data.value}}</out>
        <button type='button' {{on 'click' this.increment}}></button>`,
      Test
    );

    this.setProperties({ TestComponent });

    await render(hbs`<this.TestComponent />`);

    assert.dom('out').hasText('1');

    await click('button');

    assert.dom('out').hasText('2');
  });

  test('async functions update when the promise resolves', async function (assert) {
    class Test extends Component {
      @tracked multiplier = 1;

      increment = () => this.multiplier++;

      data = trackedFunction(this, async () => {
        // tracked data consumed here directly does not entangle with the function (deliberately)
        let { multiplier } = this;

        await new Promise((resolve) => setTimeout(resolve, 50));

        return 2 * multiplier;
      });
    }

    const TestComponent = setComponentTemplate(
      hbs`
        <out>{{this.data.value}}</out>
        <button type='button' {{on 'click' this.increment}}></button>
      `,
      Test
    );

    this.setProperties({ TestComponent });

    render(hbs`<this.TestComponent />`);

    await timeout(25);
    assert.dom('out').hasText('');

    await settled();
    assert.dom('out').hasText('2');

    click('button');
    await timeout(25);
    assert.dom('out').hasText('');

    await settled();
    assert.dom('out').hasText('4');
  });
});
