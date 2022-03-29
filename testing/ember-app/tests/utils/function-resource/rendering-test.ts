import { tracked } from '@glimmer/tracking';
import { clearRender, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { resource } from 'ember-resources/util/function-resource';

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
});
