import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { resource, use } from 'ember-resources';

import { Calculator, clock, Doubler, overInvalidatingClock } from './-resources';

export default class GlintTest extends Component {
  @tracked input = 2;

  Calculator = Calculator;
  Doubler = Doubler;
  clock = clock;
  overInvalidatingClock = overInvalidatingClock;

  calculator = Calculator.from(this, () => ({}));
  doubler = Doubler.from(this, () => [this.input]);

  decoratorLess = resource(this, () => {
    return 2 * this.input;
  });

  @use inline = resource(() => this.input);
  @use badClock = overInvalidatingClock;
  @use goodClock = clock;
}
