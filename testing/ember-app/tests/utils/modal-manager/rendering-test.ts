import Component from '@glimmer/component';
import { setComponentTemplate } from '@ember/component';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { ModalManager } from 'ember-resources/util/modal-manager';

module('Utils | modal-manager | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    class Test extends Component {
      manager = new ModalManager();
      openModal = async () => {
        assert.step('modal opened');
        let { result, value = '' } = await this.manager.open();
        assert.step(`modal ${result} (${value})`);
      };
    }

    setComponentTemplate<typeof Test>(
      hbs`
        <button id="open" type="button" {{on "click" this.openModal}}></button>
        {{#if this.manager.isOpen}}
          <button id="cancel" type="button" {{on "click" this.manager.cancel}}></button>
          <button id="confirm" type="button" {{on "click" (fn this.manager.confirm "test-confirm")}}></button>
          <button id="reject" type="button" {{on "click" (fn this.manager.reject "test-reject")}}></button>
        {{/each}}
      `,
      Test
    );

    this.setProperties({ Test });
    await render(hbs`<this.Test />`);
    await click('#open');
    await click('#cancel');
    await click('#open');
    await click('#confirm');
    await click('#open');
    await click('#reject');

    assert.verifySteps([
      'modal opened',
      'modal cancelled ()',
      'modal opened',
      'modal confirmed (test-confirm)',
      'modal opened',
      'modal rejected (test-reject)',
    ]);
  });
});
