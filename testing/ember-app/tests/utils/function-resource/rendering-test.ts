import { tracked } from '@glimmer/tracking';
import { clearRender, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { registerResourceWrapper, resource } from 'ember-resources/util/function-resource';

module('Utils | resource | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('lifecycle', async function (assert) {
    class Test {
      @tracked num = 0;
    }

    let foo = new Test();

    this.setProperties({
      theResource: resource(({ on }) => {
        let num = foo.num;

        on.cleanup(() => assert.step(`destroy ${num}`));

        assert.step(`resolve ${num}`);

        return num;
      }),
    });

    await render(hbs`
      {{#let (this.theResource) as |value|}}
        <out>{{value}}</out>
      {{/let}}
    `);

    assert.dom('out').containsText('0');

    foo.num = 2;
    await settled();

    assert.dom('out').containsText('2');

    foo.num = 7;
    await settled();

    assert.dom('out').containsText('7');

    await clearRender();

    assert.verifySteps([
      'resolve 0',
      'destroy 0',
      'resolve 2',
      'destroy 2',
      'resolve 7',
      'destroy 7',
    ]);
  });

  module('with a registered wrapper', function () {
    test('lifecycle', async function (assert) {
      function Wrapper(initial: number) {
        return resource(({ on }) => {
          on.cleanup(() => assert.step(`destroy ${initial}`));

          assert.step(`resolve ${initial}`);

          return initial + 1;
        });
      }

      registerResourceWrapper(Wrapper);

      class Test {
        @tracked num = 0;
      }

      let foo = new Test();

      this.setProperties({ Wrapper, foo });

      await render(hbs`
        {{#let (this.Wrapper this.foo.num) as |state|}}
          <out>{{state}}</out>
        {{/let}}
      `);

      assert.dom('out').containsText('1');

      foo.num = 2;
      await settled();

      assert.dom('out').containsText('3');

      foo.num = 7;
      await settled();

      assert.dom('out').containsText('8');

      await clearRender();

      /**
       * As a reminder, destruction is async
       */
      assert.verifySteps([
        'resolve 0',
        'resolve 2',
        'destroy 0',
        'resolve 7',
        'destroy 2',
        'destroy 7',
      ]);
    });
  });
});
