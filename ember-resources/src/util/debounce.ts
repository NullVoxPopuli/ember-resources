import { tracked } from '@glimmer/tracking';

import { resource } from '../core';

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
 * initially undefined (unless you pass `true` as argument for the `initialize` parameter).
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
 * @param {boolean} initialize whether the initial value should be returned inmediately, or undefined should be returned
 */
export function debounce<Value = unknown>(ms: number, thunk: () => Value, initialize: boolean = false) {
  let lastValue: Value;
  let timer: number;
  let state = new TrackedValue<Value>();

  /**
   * Whether the initial value has been returned inmediately or not
   */
  let wasInitialized = !initialize;

  return resource(({ on }) => {
    lastValue = thunk();

    if (!wasInitialized) {
      state.value = lastValue;
      wasInitialized = true;
    } else {
      on.cleanup(() => timer && clearTimeout(timer));
      timer = setTimeout(() => (state.value = lastValue), ms);
    }

    return state.value;
  });
}
