import { Resource } from "../core/class-based/index.js";
import { Named, Positional } from "../core/types.js";
/**
 * Public API of the return value of the [[map]] resource.
 */
interface MappedArray<Elements extends readonly unknown[], MappedTo> {
    /**
     * Array-index access to specific mapped data.
     *
     * If the map function hasn't ran yet on the source data, it will be ran, an cached
     * for subsequent accesses.
     *
     * ```js
     *  class Foo {
     *    myMappedData = map(this, {
     *      data: () => [1, 2, 3],
     *      map: (num) => `hi, ${num}!`
     *    });
     *
     *    get first() {
     *      return this.myMappedData[0];
     *    }
     *  }
     * ```
     */
    [index: number]: MappedTo;
    /**
     * evaluate and return an array of all mapped items.
     *
     * This is useful when you need to do other Array-like operations
     * on the mapped data, such as filter, or find
     *
     * ```js
     *  class Foo {
     *    myMappedData = map(this, {
     *      data: () => [1, 2, 3],
     *      map: (num) => `hi, ${num}!`
     *    });
     *
     *    get everything() {
     *      return this.myMappedData.values();
     *    }
     *  }
     * ```
     */
    values: () => {
        [K in keyof Elements]: MappedTo;
    };
    /**
     * Without evaluating the map function on each element,
     * provide the total number of elements
     *
     * ```js
     *  class Foo {
     *    myMappedData = map(this, {
     *      data: () => [1, 2, 3],
     *      map: (num) => `hi, ${num}!`
     *    });
     *
     *    get numItems() {
     *      return this.myMappedData.length;
     *    }
     *  }
     * ```
     */
    length: number;
    /**
     * Iterate over the mapped array, lazily invoking the passed map function
     * that was passed to [[map]].
     *
     * This will always return previously mapped records without re-evaluating
     * the map function, so the default `{{#each}}` behavior in ember will
     * be optimized on "object-identity". e.g.:
     *
     * ```js
     *  // ...
     *  myMappedData = map(this, {
     *    data: () => [1, 2, 3],
     *    map: (num) => `hi, ${num}!`
     *  });
     *  // ...
     * ```
     * ```hbs
     *  {{#each this.myMappedData as |datum|}}
     *     loop body only invoked for changed entries
     *     {{datum}}
     *  {{/each}}
     * ```
     *
     * Iteration in javascript is also provided by this iterator
     * ```js
     *  class Foo {
     *    myMappedData = map(this, {
     *      data: () => [1, 2, 3],
     *      map: (num) => `hi, ${num}!`
     *    });
     *
     *    get mapAgain() {
     *      let results = [];
     *
     *      for (let datum of this.myMappedData) {
     *        results.push(datum);
     *      }
     *
     *      return datum;
     *    }
     *  }
     * ```
     */
    [Symbol.iterator](): Iterator<MappedTo>;
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
 * Reactivily apply a `map` function to each element in an array,
 * persisting map-results for each object, based on identity.
 *
 * This is useful when you have a large collection of items that
 * need to be transformed into a different shape (adding/removing/modifying data/properties)
 * and you want the transform to be efficient when iterating over that data.
 *
 * A common use case where this `map` resource provides benefits over is
 * ```js
 * class MyClass {\
 *   @cached
 *   get wrappedRecords() {
 *     return this.records.map(record => new SomeWrapper(record));
 *   }
 * }
 * ```
 *
 * Even though the above is `@cached`, if any tracked data accessed during the evaluation of `wrappedRecords`
 * changes, the entire array.map will re-run, often doing duplicate work for every unchanged item in the array.
 *
 * @return {MappedArray} an object that behaves like an array. This shouldn't be modified directly. Instead, you can freely modify the data returned by the `data` function, which should be tracked in order to benefit from this abstraction.
 *
 * @example
 *
 * ```js
 *  import { map } from 'ember-resources/util/map';
 *
 *  class MyClass {
 *    wrappedRecords = map(this, {
 *      data: () => this.records,
 *      map: (record) => new SomeWrapper(record),
 *    }),
 *  }
 * ```
 */
declare function map<Elements extends readonly unknown[], MapTo = unknown>(
/**
 * parent destroyable context, usually `this`
 */
destroyable: object, options: {
    /**
     * Array of non-primitives to map over
     *
     * This can be class instances, plain objects, or anything supported by WeakMap's key
     */
    data: () => Elements;
    /**
     * How to transform each element from `data`,
     * similar to if you were to use Array map yourself.
     *
     * This function will be called only when needed / on-demand / lazily.
     * - if iterating over part of the data, map will only be called for the elements observed
     * - if not iterating, map will only be called for the elements observed.
     */
    map: (element: Elements[number]) => MapTo;
}): MappedArray<Elements, MapTo> & { [K in keyof Elements]: MapTo; };
type Args<E = unknown, Result = unknown> = {
    Positional: [E[] | readonly E[]];
    Named: {
        map: (element: E) => Result;
    };
};
declare const AT: unique symbol;
/**
 * @private
 */
declare class TrackedArrayMap<Element = unknown, MappedTo = unknown> extends Resource<Args<Element, MappedTo>> implements MappedArray<Element[], MappedTo> {
    #private;
    [index: number]: MappedTo;
    private _records;
    private _map;
    modify([data]: Positional<Args<Element, MappedTo>>, { map }: Named<Args<Element, MappedTo>>): void;
    values: () => MappedTo[];
    get length(): number;
    [Symbol.iterator](): Iterator<MappedTo>;
    /**
     * @private
     *
     * don't conflict with
     *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at
     */
    /**
     * @private
     *
     * don't conflict with
     *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at
     */
    [AT](i: number): MappedTo;
}
export { MappedArray, map, TrackedArrayMap };
