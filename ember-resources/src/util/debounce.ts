import { tracked } from '@glimmer/tracking';
import { deprecate } from '@ember/debug';

import { resource } from '../core';

deprecate(
  `importing from 'ember-resources/util/debounce' is deprecated and will be removed in ember-resources@v7. ` +
    `The exact same code and support is available at https://github.com/universal-ember/reactiveweb. ` +
    `\`pnpm add reactiveweb\` and then \` import { debounce } from 'reactiveweb/debounce';\`. ` +
    `See also: https://github.com/NullVoxPopuli/ember-resources/issues/1061`,
  false,
  {
    id: `ember-resources.util.debounce`,
    until: `7.0.0`,
    for: `ember-resources`,
    url: `https://reactive.nullvoxpopuli.com/functions/debounce.debounce.html`,
    since: {
      available: '6.4.4',
      enabled: '6.4.4',
    },
  },
);

class TrackedValue<T> {
  @tracked value: T | undefined;
}

/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but is an example utility to demonstrate a concept when authoring your own resources. However, this utility is still under the broader library's SemVer policy.
 *
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * </div>
 *
 * A utility for debouncing high-frequency updates.
 * The returned value will only be updated every `ms` and is
 * initially undefined.
 *
 * This can be useful when a user's typing is updating a tracked
 * property and you want to derive data less frequently than on
 * each keystroke.
 *
 * Note that this utility requires the `@use` decorator
 * (debounce could be implemented without the need for the `@use` decorator
 * but the current implementation is 8 lines)
 *
 * @example
 * ```js
 *  import Component from '@glimmer/component';
 *  import { tracked } from '@glimmer/tracking';
 *  import { debounce } from 'ember-resources/util/debounce';
 *
 *  const delay = 100; // ms
 *
 *  class Demo extends Component {
 *    @tracked userInput = '';
 *
 *    @use debouncedInput = debounce(delay, () => this.userInput);
 *  }
 * ```
 *
 * @example
 * This could be further composed with RemoteData
 * ```js
 *  import Component from '@glimmer/component';
 *  import { tracked } from '@glimmer/tracking';
 *  import { debounce } from 'ember-resources/util/debounce';
 *  import { RemoteData } from 'ember-resources/util/remote-data';
 *
 *  const delay = 100; // ms
 *
 *  class Demo extends Component {
 *    @tracked userInput = '';
 *
 *    @use debouncedInput = debounce(delay, () => this.userInput);
 *
 *    @use search = RemoteData(() => `https://my.domain/search?q=${this.debouncedInput}`);
 *  }
 * ```
 *
 * @param {number} ms delay in milliseconds to wait before updating the returned value
 * @param {() => Value} thunk function that returns the value to debounce
 */
export function debounce<Value = unknown>(ms: number, thunk: () => Value) {
  let lastValue: Value;
  let timer: number;
  let state = new TrackedValue<Value>();

  return resource(({ on }) => {
    lastValue = thunk();

    on.cleanup(() => timer && clearTimeout(timer));
    timer = setTimeout(() => (state.value = lastValue), ms);

    return state.value;
  });
}
