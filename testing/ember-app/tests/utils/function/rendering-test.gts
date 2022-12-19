import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { click, render, settled } from '@ember/test-helpers';
// @ts-ignore
import { on } from '@ember/modifier';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { timeout } from 'ember-concurrency';
import { trackedFunction } from 'ember-resources/util/function';

module('Utils | trackedFunction | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    class TestComponent extends Component {
      @tracked count = 1;

      data = trackedFunction(this, () => {
        return this.count;
      });
      increment = () => this.count++;

      <template>
        <out>{{this.data.value}}</out>
        <button type='button' {{on 'click' this.increment}}></button>
      </template>
    }

    await render(<template><TestComponent /></template>);

    assert.dom('out').hasText('1');

    await click('button');

    assert.dom('out').hasText('2');
  });

  test('it is retryable', async function (assert) {
    let count = 0;

    class TestComponent extends Component {
      data = trackedFunction(this, () => {
        assert.step(`ran trackedFunction ${count++}`);

        return count;
      });

      <template>
        <out>{{this.data.value}}</out>
        <button type='button' {{on 'click' this.data.retry}}></button>
      </template>
    }

    await render(<template><TestComponent /></template>);

    assert.dom('out').hasText('1');

    await click('button');

    assert.dom('out').hasText('2');

    assert.verifySteps(['ran trackedFunction 0', 'ran trackedFunction 1']);
  });

  test('async functions update when the promise resolves', async function (assert) {
    class TestComponent extends Component {
      @tracked multiplier = 1;

      increment = () => this.multiplier++;

      data = trackedFunction(this, async () => {
        // tracked data consumed here directly does not entangle with the function (deliberately)
        let { multiplier } = this;

        await new Promise((resolve) => setTimeout(resolve, 50));

        return 2 * multiplier;
      });

      <template>
        <out>{{this.data.value}}</out>
        <button type='button' {{on 'click' this.increment}}></button>
      </template>
    }


    render(<template><TestComponent /></template>);

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
