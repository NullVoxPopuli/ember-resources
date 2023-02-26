import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { click, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

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

  test('it is retryable', async function (assert) {
    let count = 0;

    class Test extends Component {
      data = trackedFunction(this, () => {
        assert.step(`ran trackedFunction ${count++}`);

        return count;
      });
    }

    const TestComponent = setComponentTemplate(
      hbs`
        <out>{{this.data.value}}</out>
        <button type='button' {{on 'click' this.data.retry}}></button>`,
      Test
    );

    console.log('0')

    this.setProperties({ TestComponent });

    console.log('1')

    await render(hbs`<this.TestComponent />`);

    console.log('2')

    assert.dom('out').hasText('1');

    console.log('3')

    await click('button');

    console.log('4')

    assert.dom('out').hasText('2');

    console.log('5')

    assert.verifySteps(['ran trackedFunction 0', 'ran trackedFunction 1']);

    console.log('6')
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
    await settled();
    await settled();

    assert.dom('out').hasText('2');

    click('button');
    await settled();
    await settled();

    assert.dom('out').hasText('4');
  });
});
