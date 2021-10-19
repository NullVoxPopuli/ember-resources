import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { getValue } from '@glimmer/tracking/primitives/cache';
import { setComponentTemplate } from '@ember/component';
import Helper from '@ember/component/helper';
import { invokeHelper } from '@ember/helper';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

module('RFC#762', function (hooks) {
  setupRenderingTest(hooks);

  test('lazy tracked data', async function (assert) {
    assert.expect(4);

    class RemoteData extends Helper {
      compute(params, { foo }) {
        return foo + 1;
      }
    }

    class PlusOne extends Component {
      @tracked startingNumber = 1;

      plusOne = invokeHelper(this, RemoteData, () => {
        return {
          positional: [],
          named: {
            get foo() {
              assert.ok(this instanceof PlusOne, `this instanceof PlusOne`);
              return this.startingNumber;
            },
          },
        };
      });

      get result() {
        return getValue(this.plusOne);
      }

      increment = () => this.startingNumber++;
    }

    setComponentTemplate(
      hbs`
      <output>{{this.result}}</output>

      <button {{on 'click' this.increment}}>Increment</button>
    `,
      PlusOne
    );

    this.setProperties({ PlusOne });

    await render(hbs`<this.PlusOne />`);

    assert.dom('output').hasText('2');
    await click('button');
    assert.dom('output').hasText('3');
  });
});
