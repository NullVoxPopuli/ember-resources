import Component from '@glimmer/component';
import { render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell, resource, use } from 'ember-resources';

import type { Reactive} from 'ember-resources';

type Cell<T> = ReturnType<typeof cell<T>>;

 export type ClockNakedSignature = {
  percentage: Cell<number>;
  counter: Cell<number>;
};

export type ClockSignature = Reactive<ClockNakedSignature>;

interface Signature {
  Args: {};
  Blocks: {
    default: [ClockNakedSignature];
  };
  Element: HTMLDivElement;
}

const Clock = resource(() => {
  const counter = cell(0);
  const percentage = cell(0);

  return { percentage, counter };
});


// use (the function) exposes a .current property, like a Cell
class Refresher extends Component<Signature> {
  clock = use(this, Clock);

  <template>{{yield this.clock.current}}</template>
}

// with use (the decorator) the .current access is absorbed in an underlying getter
class Refresher2 extends Component<Signature> {
  @use clock = Clock;

  <template>{{yield this.clock}}</template>
}

const keys = (o: Record<string, unknown>) => Object.keys(o).join(',');

module('issues/1128', function(hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    await render(<template>
      <Refresher as |r|>
        <output id="one-keys">{{keys r}}</output>
        <output id="one">{{r.percentage.current}}</output>
      </Refresher>
      <Refresher2 as |r|>
        <output id="two-keys">{{keys r}}</output>
        <output id="two">{{r.percentage.current}}</output>
      </Refresher2>
    </template>);

    assert.dom('#one-keys').hasText('percentage,counter');
    assert.dom('#two-keys').hasText('percentage,counter');
    assert.dom('#one').hasText('0');
    assert.dom('#two').hasText('0');
  });

});
