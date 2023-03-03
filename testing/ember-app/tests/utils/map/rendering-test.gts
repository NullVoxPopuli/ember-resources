import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
// idk what's going on here.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { helper } from '@ember/component/helper';
import { concat } from '@ember/helper';
import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { map } from 'ember-resources/util/map';

module('Utils | map | rendering', function (hooks) {
  setupRenderingTest(hooks);

  class Wrapper<T = unknown> {
    constructor(public record: T) {}
  }

  interface TestRecord {
    id: number;
    someProp?: string;
  }

  class ExampleTrackedThing {
    @tracked declare id: number;
    @tracked someValue = '';

    constructor(id: number) {
      this.id = id;
    }
  }

  function testData(id: number) {
    return new ExampleTrackedThing(id);
  }

  test('it works', async function (assert) {
    let step = helper(([text]: [string]) => assert.step(text));

    class Context {
      @tracked records: Array<TestRecord | undefined> = [];
    }

    class Test extends Component<{ Args: { ctx: Context } }> {
      step = step;
      stuff = map(this, {
        data: () => {
          assert.step('evaluate data thunk');

          return this.args.ctx.records;
        },
        map: (record) => {
          assert.step(`perform map on ${record?.id}`);

          return new Wrapper(record);
        },
      });

      <template>
        {{#each this.stuff as |wrapped|}}
          {{this.step (concat "each loop - id:" wrapped.record.id)}}
          <output>{{wrapped.record.id}}</output>
        {{/each}}
      </template>
    }

    let ctx = new Context();

    await render(<template><Test @ctx={{ctx}} /></template>);

    assert.dom('output').doesNotExist();
    assert.verifySteps(['evaluate data thunk']);

    // Add first element
    ctx.records = [testData(1)];
    await settled();
    assert.dom('output').exists({ count: 1 });
    assert.verifySteps(['evaluate data thunk', 'perform map on 1', 'each loop - id:1']);

    // Add second element
    ctx.records = [...ctx.records, testData(2)];
    await settled();
    assert.dom('output').exists({ count: 2 });
    assert.verifySteps(['evaluate data thunk', 'perform map on 2', 'each loop - id:2']);

    // Add two elements at once
    ctx.records = [...ctx.records, testData(3), testData(4)];
    await settled();
    assert.dom('output').exists({ count: 4 });
    assert.verifySteps([
      'evaluate data thunk',
      'perform map on 3',
      'perform map on 4',
      'each loop - id:3',
      'each loop - id:4',
    ]);

    // Change one of the elements
    ctx.records = [ctx.records[0], testData(5), ctx.records[2], ctx.records[3]];
    await settled();
    assert.dom('output').exists({ count: 4 }, 'number of each iterations remains');
    assert.verifySteps(
      ['evaluate data thunk', 'perform map on 5', 'each loop - id:5'],
      'map occurs only on the new element, each loop only evaluates for the replaced element'
    );

    // Removing the first element
    ctx.records = [ctx.records[1], ctx.records[2], ctx.records[3]];
    await settled();
    assert.dom('output').exists({ count: 3 }, 'one less iteration');
    assert.verifySteps(['evaluate data thunk'], 'no map occurs, because the VM handles removal');
  });
});
