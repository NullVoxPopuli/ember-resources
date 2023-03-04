import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { use } from 'ember-resources';
import { debounce } from 'ember-resources/util/debounce';

export default class GlintTest extends Component {
  @tracked input = 2;

  // @useless usage is not supported yet
  // aDebounce = debounce(this, () => this.input);

  // use is not supported yet
  @use bDebounce = debounce(200, () => this.input);


  <template>
    {{this.bDebounce}}
  </template>
}
