import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import Helper, { helper as emberHelper } from '@ember/component/helper';

// import { use } from 'ember-resources';
import { helper } from 'ember-resources/util/helper';

interface DoublerArgs {
  Args: {
    Positional: [number],
  },
  Return: number
}

export const doubler = emberHelper<DoublerArgs>(([num]) => num * 2);


export class Doubler<S extends DoublerArgs = DoublerArgs> extends Helper<DoublerArgs> {
  compute([num]: S['Args']['Positional']): S['Return'] {
    return num * 2;
  }
}


export default class GlintTest extends Component {
  @tracked input = 2;

  // helper does not yet support Glint
  aHelper = helper(this, doubler, () => [this.input]);
  bHelper = helper(this, Doubler, () => [this.input]);

  // use is not supported yet
  // @use bHelper = helper(doubler, () => [this.input]);

  // class-based helpers don't have return-type inference working
  // {{this.bHelper.value}}

  <template>
    {{this.aHelper.value}}
  </template>
}
