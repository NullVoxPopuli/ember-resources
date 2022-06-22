import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { hbs } from 'ember-cli-htmlbars';

import { resource, use } from 'ember-resources';

import { Calculator, clock, Doubler, overInvalidatingClock } from './-resources';

export default class GlintTest extends Component {
  @tracked input = 2;

  Calculator = Calculator;
  Doubler = Doubler;
  clock = clock;
  overInvalidatingClock = overInvalidatingClock;

  calculator = Calculator.from(this);
  doubler = Doubler.from(this, () => [this.input]);

  decoratorLess = resource(this, () => {
    return 2 * this.input;
  });

  @use inline = resource(() => this.input);
  @use badClock = overInvalidatingClock;
  @use goodClock = clock;
}

setComponentTemplate(
  hbs`
  {{!-- direct invocation --}}
  {{this.clock}}
  {{this.overInvalidatingClock}}

  {{get (this.Calculator) 'prop'}}
  {{#let (this.Calculator) as |calc|}}
    {{calc.prop}}
    {{calc.double this.input}}
  {{/let}}


  {{#let (this.Doubler this.input) as |doubler|}}
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
`,
  GlintTest
);
