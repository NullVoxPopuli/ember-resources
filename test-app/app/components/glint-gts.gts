import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { get } from '@ember/helper';

import { resource, use } from 'ember-resources';

import { Calculator, clock,Doubler, overInvalidatingClock } from './-resources';

const SomeClocks = <template>
  {{!-- direct invocation --}}

  {{clock}}
  {{overInvalidatingClock}}
</template>;

export default class GlintTest extends Component {
  @tracked input = 2;

  calculator = Calculator.from(this, () => ({}));
  doubler = Doubler.from(this, () => [this.input])

  decoratorLess = resource(this, () => {
    return 2 * this.input;
  });

  @use inline = resource(() => this.input);
  @use badClock = overInvalidatingClock;
  @use goodClock = clock;

  <template>
    <SomeClocks />
    {{!-- direct invocation --}}

    {{get (Calculator) 'prop'}}
    {{#let (Calculator) as |calc|}}
      {{calc.prop}}
      {{calc.double this.input}}
    {{/let}}


    {{#let (Doubler this.input) as |doubler|}}
      {{doubler.value}}
    {{/let}}


    {{!-- class-based resource --}}

    {{this.calculator.prop}}
    {{this.calculator.double 4}}
    {{this.doubler.value}}

    {{#let (this.calculator.double 5) as |ten|}}
      {{ten}}
    {{/let}}

    {{!-- function-based resource --}}

    {{this.decoratorLess}}
    {{this.badClock}}
    {{this.goodClock}}
  </template>
}
