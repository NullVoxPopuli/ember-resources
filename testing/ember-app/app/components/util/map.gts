import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

// import { use } from 'ember-resources';
import { map } from 'ember-resources/util/map';

export default class GlintTest extends Component {
  @tracked input = 2;

  aMap = map(this, {
    data: () => [1, 2],
    map: (datum) => datum,
  });

  // use is not supportted here yet
  // @use bMap = map({
  //   data: () => [1, 2],
  //   map: (datum) => datum,
  // });


  <template>
    {{#each this.aMap as |datum|}}
      {{datum}}
    {{/each}}
  </template>
}
