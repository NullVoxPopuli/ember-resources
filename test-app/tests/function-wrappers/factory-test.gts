
import { render} from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { resource, cell } from 'ember-resources';

// Will need to be a class for .current flattening / auto-rendering
interface Reactive<Value> {
  current: Value;
}

module('function-wrappers | Core | (function) resource | use | rendering', function (hooks) {
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

    function Now(ms = 1000) {
      return resource(({ on }) => {
        let now = cell(nowDate);
        let timer = setInterval(() => now.set(Date.now()), ms);

        on.cleanup(() => clearInterval(timer));

        return () => now.current;
      });
    }

    function Stopwatch(ms = 500) {
      return resource(({ use }) => {
        let time = use(Now(ms));

        return () => format(time);
      });
    }

    await render(<template><time>{{Stopwatch 250}}</time></template>);

    let first = formatter.format(Date.now());
    assert.dom('time').hasText(first);

    await wait(1010);

    let second = formatter.format(Date.now());
    assert.dom('time').hasText(second);
    assert.notEqual(first, second);
  });
});
