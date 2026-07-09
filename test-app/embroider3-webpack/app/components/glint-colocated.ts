import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { resource, use } from 'ember-resources';

import { clock, overInvalidatingClock } from './-resources';

export default class GlintTest extends Component {
  @tracked input = 2;

  clock = clock;
  overInvalidatingClock = overInvalidatingClock;

  decoratorLess = resource(this, () => {
    return 2 * this.input;
  });

  @use inline = resource(() => this.input);
  @use badClock = overInvalidatingClock;
  @use goodClock = clock;
}
