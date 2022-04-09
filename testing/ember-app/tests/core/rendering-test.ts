import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { Resource } from 'ember-resources/core';

module('Core | Resource | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    class Doubler extends Resource<{ positional: [number] }> {
      @tracked num = 0;

      modify(positional: number[]) {
        this.num = positional[0] * 2;
      }
    }

    class Test extends Component {
      @tracked count = 0;

      data = Resource.of(this, Doubler, () => [this.count]);
      increment = () => this.count++;
    }

    const TestComponent = setComponentTemplate(
      hbs`
        <out>{{this.data.num}}</out>
        <button type='button' {{on 'click' this.increment}}>increment</button>`,
      Test
    );

    this.setProperties({ TestComponent });

    await render(hbs`<this.TestComponent />`);

    assert.dom('out').hasText('0');

    await click('button');

    assert.dom('out').hasText('2');
  });
});
