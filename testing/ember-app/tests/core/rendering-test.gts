import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

// @ts-ignore
import { on } from '@ember/modifier';

import { Resource, cell, use } from 'ember-resources';

module('Core | Resource | rendering', function (hooks) {
  setupRenderingTest(hooks);

  class Doubler extends Resource<{ positional: [number] }> {
    @tracked num = 0;

    modify(positional: [number]) {
      this.num = positional[0] * 2;
    }
  }

  module('directly in a template', function() {
    test('it works', async function (assert) {
      let count = cell(0);
      let increment = () => count.current++;

      await render(<template>
        {{! TODO: 0.8.3 doesn't support this }}
        {{! @glint-ignore}}
        <out>{{ Doubler count.current }}</out>
        <button type='button' {{on 'click' increment}}>increment</button>
      </template>);

      assert.dom('out').hasText('0');

      await click('button');

      assert.dom('out').hasText('2');
    });
  });

  module('in a class', function () {
    test('it works in a class', async function (assert) {
      class Test {
        @tracked count = 0;

        data = Doubler.from(this, () => [this.count]);
        increment = () => this.count++;
      }

      let foo = new Test();

      await render(<template>
        <out>{{foo.data.num}}</out>
        <button type='button' {{on 'click' foo.increment}}>increment</button>
      </template>);

      assert.dom('out').hasText('0');

      await click('button');

      assert.dom('out').hasText('2');
    });

    test('it works with @use', async function (assert) {
      class Test {
        @tracked count = 0;


        @use data = Doubler.from(() => [this.count]);
        increment = () => this.count++;
      }

      let foo = new Test();

      await render(<template>
        <out>{{foo.data.num}}</out>
        <button type='button' {{on 'click' foo.increment}}>increment</button>
      </template>);

      assert.dom('out').hasText('0');

      await click('button');

      assert.dom('out').hasText('2');
    });
  });
});
