import { render, rerender, clearRender } from '@ember/test-helpers';
import { tracked } from '@glimmer/tracking';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { resource, cell } from 'ember-resources';

// Will need to be a class for .current flattening / auto-rendering
interface Reactive<Value> {
  current: Value;
}

module('Core | resource | use | rendering', function (hooks) {
  setupRenderingTest(hooks);

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  let formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  test('it works', async function (assert) {
    let nowDate = Date.now();
    let format = (time: Reactive<number>) => formatter.format(time.current);

    const Now = resource(({ on }) => {
      let now = cell(nowDate);
      let timer = setInterval(() => now.set(Date.now()), 1000);

      on.cleanup(() => clearInterval(timer));

      return () => now.current;
    });

    const Stopwatch = resource(({ use }) => {
      let time = use(Now);

      return () => format(time);
    });

    await render(<template><time>{{Stopwatch}}</time></template>);

    let first = formatter.format(Date.now());
    assert.dom('time').hasText(first);

    await wait(1010);

    let second = formatter.format(Date.now());
    assert.dom('time').hasText(second);
    assert.notEqual(first, second);
  });

  test('lifecycle timing is appropriate', async function (assert) {
    class State {
      @tracked outerValue = 0;
      @tracked innerValue = 0;
      @tracked value = 0;
    }

    let state = new State();

    const Outer = resource(({ on }) => {
      let outerValue = state.outerValue;
      assert.step(`Outer:setup ${outerValue}`);

      on.cleanup(() => {
        assert.step(`Outer:cleanup ${outerValue}`);
      });

      return () => {
        assert.step(`Outer:value:${state.value}`);
        return state.value;
      };
    });

    const Inner = resource(({ on, use }) => {
      let innerValue = state.innerValue;
      assert.step(`Inner:setup ${innerValue}`);

      let result = use(Outer);

      on.cleanup(() => {
        assert.step(`Inner:cleanup ${innerValue}`);
      });

      return () => {
        assert.step(`Inner:value:${result.current}`);
        return result.current;
      };
    });

    await render(<template><div>{{Inner}}</div></template>);

    assert.verifySteps(
      ['Inner:setup 0', 'Outer:setup 0', 'Outer:value:0', 'Inner:value:0'],
      'initial setup'
    );

    state.value++;

    await rerender();
    assert.verifySteps(
      ['Outer:value:1', 'Inner:value:1'],
      'no cleanup or re-setup is needed, only the values are re-evaluated'
    );

    state.innerValue++;

    await rerender();
    assert.verifySteps(
      ['Inner:setup 1', 'Outer:setup 0', 'Outer:value:1', 'Inner:value:1', 'Outer:cleanup 0', 'Inner:cleanup 0'],
      'outer is re-setup'
    );

    state.value++;

    await rerender();
    assert.verifySteps(['Outer:value:2', 'Inner:value:2'], 'only values are re-rendered');

    state.outerValue++;

    await rerender();
    assert.verifySteps(['Outer:setup 1', 'Outer:value:2', 'Inner:value:2', 'Outer:cleanup 0']);

    await clearRender();

    assert.verifySteps(['Outer:cleanup 1', 'Inner:cleanup 1']);
  });
});
