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

  toggle = () => {
    assert(
      `toggle can only be used when 'current' is a boolean type`,
      typeof this.current === 'boolean' || this.current === undefined
    );

    (this.current as boolean) = !this.current;
  };
}

/**
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
    return new Cell(initialValue);
  }

  return new Cell();
}
