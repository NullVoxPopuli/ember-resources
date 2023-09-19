import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { resource, cell } from 'ember-resources';
import { overrideDefaultManagers } from 'ember-resources/override-default-managers';

overrideDefaultManagers();

module('function wrappers | modifier | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('no arguments', async function (assert) {
    function capture(...args) {
      assert.step(`${args.length} args`);

      let [element] = args;

      return resource(() => {
        assert.step(`received element ${element.tagName}`);
      });
    }

    await render(<template><div {{capture}}>content</div></template>);

    assert.verifySteps(['1 args', 'received element DIV']);
  });

  test('mixed arguments', async function (assert) {
    const named = cell(0);
    const positional = cell(0);
    const visible = cell(true);

    function capture(...args: [Element, number, { value: number }]) {
      assert.step(`${args.length} args`);

      return resource(({ on }) => {
        let positionalValue = args[1];
        let { value } = args[2];

        assert.step(`received element ${args[0].tagName} for value ${positionalValue},${value}`);

        on.cleanup(() => assert.step(`cleanup ${positionalValue},${value}`));
      });
    }

    await render(<template>
      {{#if visible.current}}
        <div {{capture positional.current value=named.current}}>content</div>
      {{/if}}
    </template>);

    assert.verifySteps(['3 args', 'received element DIV for value 0,0']);

    named.current++;
    await settled();
    assert.verifySteps(['3 args', 'received element DIV for value 0,1', 'cleanup 0,0']);

    visible.current = false;
    await settled();
    assert.verifySteps(['cleanup 0,1']);

    positional.current++;
    visible.current = true;
    await settled();

    assert.verifySteps(['3 args', 'received element DIV for value 1,1']);

    positional.current++;
    await settled();
    assert.verifySteps(['3 args', 'received element DIV for value 2,1', 'cleanup 1,1']);

    visible.current = false;
    await settled();
    assert.verifySteps(['cleanup 2,1']);
  });
});
