import { tracked } from '@glimmer/tracking';
import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

// @ts-ignore
import { on } from '@ember/modifier';

import { Resource, resourceFactory, resource, cell, use } from 'ember-resources';

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
        {{#let (Doubler count.current) as |doubler|}}
          <out>{{doubler.num}}</out>
        {{/let}}
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

  module('cleanup with wrapping factory/blueprint', function() {
    test('a generated interval can be cleared', async function (assert) {
      const id = cell(0);
      const condition = cell(true);

      const poll = resourceFactory((id: number) => {
        return resource(({ on }) => {
          assert.step(`setup: ${id}`);
          on.cleanup(() => assert.step(`cleanup: ${id}`));
          return id;
        });
      });

      await render(
        <template>
          <button type="button" {{on 'click' condition.toggle}}>Toggle</button><br />

          {{#if condition.current}}
            {{poll id.current}}
          {{/if}}
        </template>
      );

      assert.verifySteps(['setup: 0']);

      await click('button');

      assert.verifySteps(['cleanup: 0']);

      id.current++;
      await click('button');

      assert.verifySteps(['setup: 1']);

      await click('button');

      assert.verifySteps(['cleanup: 1']);
    });
  });
});
