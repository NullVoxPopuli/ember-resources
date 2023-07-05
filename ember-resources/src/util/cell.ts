import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';

class Cell<Value = unknown> {
  @tracked declare current: Value;

  constructor();
  constructor(initialValue: Value);
  constructor(initialValue?: Value) {
    if (initialValue !== undefined) {
      this.current = initialValue;
    }
  }

  /**
   * Toggles the value of `current` only if
   * `current` is a boolean -- errors otherwise
   */
  toggle = () => {
    assert(
      `toggle can only be used when 'current' is a boolean type`,
      typeof this.current === 'boolean' || this.current === undefined
    );

    (this.current as boolean) = !this.current;
  };

  /**
   * Updates the value of `current`
   * by calling a function that receives the previous value.
   */
  update = (updater: (prevValue: Value) => Value) => {
    this.current = updater(this.current);
  };

  /**
   * Updates the value of `current`
   */
  set = (nextValue: Value) => {
    this.current = nextValue;
  };
}

/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but is a useful utility when working with Resources. This utility is still under the broader library's SemVer policy. Additionally, the "Cell" is a core concept in Starbeam. See [Cells in Starbeam](https://www.starbeamjs.com/guides/fundamentals/cells.html)
 *
 * </div>
 *
 *
 * Small state utility for helping reduce the number of imports
 * when working with resources in isolation.
 *
 * The return value is an instance of a class with a single
 * `@tracked` property, `current`. If `current` is a boolean,
 * there is a `toggle` method available as well.
 *
 * For example, a Clock:
 *
 * ```js
 * import { resource, cell } from 'ember-resources';
 *
 * const Clock = resource(({ on }) => {
 *   let time = cell(new Date());
 *   let interval = setInterval(() => time.current = new Date(), 1000);
 *
 *   on.cleanup(() => clearInterval(interval));
 *
 *   let formatter = new Intl.DateTimeFormat('en-US', {
 *     hour: 'numeric',
 *     minute: 'numeric',
 *     second: 'numeric',
 *     hour12: true,
 *   });
 *
 *   return () => formatter.format(time.current);
 * });
 *
 * <template>
 *   It is: <time>{{Clock}}</time>
 * </template>
 * ```
 */
export function cell<Value = unknown>(initialValue?: Value): Cell<Value> {
  if (initialValue !== undefined) {
    return new Cell(initialValue as Value);
  }

  return new Cell();
}
