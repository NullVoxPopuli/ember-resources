import Component from '@glimmer/component';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell, resource, resourceFactory, use } from 'ember-resources';

import type { Cell, Reactive} from 'ember-resources';

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

const Clock = resource(({ on }) => {
  const counter = cell(0);
  const percentage = cell(0);

  return { percentage, counter };
});

export default class Refresher extends Component<Signature> {
  @use clock = Clock;

  <template>{{yield this.clock}}</template>
}

module('issues/1128', function(hooks) {
  setupRenderingTest(hooks);

  test('it works', async function () {

  });

});
