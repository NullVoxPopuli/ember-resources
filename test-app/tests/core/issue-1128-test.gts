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


class Refresher extends Component<Signature> {
  // use (the function) exposes a .current property, like a Cell
  clock = use(this, Clock);

  <template>{{yield this.clock.current}}</template>
}

class Refresher2 extends Component<Signature> {
  // with use (the decorator) the .current access is absorbed in an underlying getter
  @use clock = Clock;

  <template>{{yield this.clock}}</template>
}

module('issues/1128', function(hooks) {
  setupRenderingTest(hooks);

  test('it works', async function () {
    await render(<template>
      <Refresher as |r|>
        {{log r.percentage.current}}
      </Refresher>
      <Refresher2 as |r|>
        {{log r.percentage.current}}
      </Refresher2>
    </template>);
  });

});
