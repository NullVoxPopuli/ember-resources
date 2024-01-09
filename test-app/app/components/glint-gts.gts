import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { resource, use } from 'ember-resources';

import { clock, overInvalidatingClock } from './-resources';

const SomeClocks = <template>
  {{!-- direct invocation --}}

  {{clock}}
  {{overInvalidatingClock}}
</template>;

export default class GlintTest extends Component {
  @tracked input = 2;

  decoratorLess = resource(this, () => {
    return 2 * this.input;
  });

  @use inline = resource(() => this.input);
  @use badClock = overInvalidatingClock;
  @use goodClock = clock;

  <template>
    <SomeClocks />
    {{!-- direct invocation --}}

    {{!-- function-based resource --}}

    {{this.decoratorLess}}
    {{this.badClock}}
    {{this.goodClock}}
  </template>
}
