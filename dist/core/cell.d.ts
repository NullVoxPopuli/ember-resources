import { CURRENT, Reactive } from "./function-based/types.js";
declare class ReadonlyCell<Value> implements Reactive<Value> {
    #private;
    constructor(getter: () => Value);
    toHTML(): string;
    get [CURRENT](): Value;
    get current(): Value;
}
declare class Cell<Value = unknown> implements Reactive<Value> {
    current: Value;
    get [CURRENT](): Value;
    toHTML(): string;
    constructor();
    constructor(initialValue: Value);
    /**
     * Toggles the value of `current` only if
     * `current` is a boolean -- errors otherwise
     */
    toggle: () => void;
    /**
     * Updates the value of `current`
     * by calling a function that receives the previous value.
     */
    update: (updater: (prevValue: Value) => Value) => void;
    /**
     * Updates the value of `current`
     */
    set: (nextValue: Value) => void;
    /**
     * Returns the current value.
     */
    read: () => Value;
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
 *
 * Additionally, cells can be directly rendered:
 * ```js
 * import { resource, cell } from 'ember-resources';
 *
 * const value = cell(0);
 *
 * <template>
 *    {{value}}
 * </template>
 * ```
 *
 */
declare function cell<Value = unknown>(initialValue?: Value): Cell<Value>;
export { ReadonlyCell, Cell, cell };
//# sourceMappingURL=core/cell.d.ts.map