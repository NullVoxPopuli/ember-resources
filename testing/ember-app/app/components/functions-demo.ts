import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { trackedFunction } from 'ember-resources';

export default class FunctionsDemo extends Component {
  @tracked endpoint = 'starships';

  data = trackedFunction(this, async () => {
    console.debug(`fetching ${this.endpoint}`);

    let response = await fetch(`https://swapi.dev/api/${this.endpoint}`);
    let json = await response.json();

    return json.results;
  });

  get records() {
    return this.data.value ?? [];
  }

  // --------
  trackedFnToggle = () => {
    this.endpoint = this.endpoint === 'starships' ? 'planets' : 'starships';
  };
}
