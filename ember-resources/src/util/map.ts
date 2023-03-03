import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';

import { Resource } from '../core/class-based';

import type { Named, Positional } from '../core/types';

/**
 * Public API of the return value of the [[map]] resource.
 */
export interface MappedArray<Elements extends readonly unknown[], MappedTo> {
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
  values: () => { [K in keyof Elements]: MappedTo };

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
  // ^ in TS 4.3+, this can change to get length(): number;
  //   as a funny side-effect of changing this back to just a simple property,
  //   type-declaration-maps work again

  /**
   * Iterate over the mapped array, lazily invoking the passed map function
   * that was passed to [[map]].
   *
   * This will always return previously mapped records without re-evaluting
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
export function map<Elements extends readonly unknown[], MapTo = unknown>(
  /**
   * parent destroyable context, unually `this`
   */
  destroyable: object,
  options: {
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
  }
) {
  let { data, map } = options;

  let resource = (TrackedArrayMap<Elements[number], MapTo>).from(destroyable, () => {
    let reified = data();

    return { positional: [reified], named: { map } };
  });

  /**
   * This is what allows square-bracket index-access to work.
   *
   * Unfortunately this means the returned value is
   * Proxy -> Proxy -> wrapper object -> *then* the class instance
   *
   * Maybe JS has a way to implement array-index access, but I don't know how
   */
  return new Proxy(resource, {
    get(target, property, receiver) {
      if (typeof property === 'string') {
        let parsed = parseInt(property, 10);

        if (!isNaN(parsed)) {
          return target[AT](parsed);
        }
      }

      return Reflect.get(target, property, receiver);
    },
    // Is there a way to do this without lying to TypeScript?
  }) as unknown as MappedArray<Elements, MapTo> & { [K in keyof Elements]: MapTo };
}

type Args<E = unknown, Result = unknown> = {
  Positional: [E[] | readonly E[]];
  Named: {
    map: (element: E) => Result;
  };
};

const AT = Symbol('__AT__');

/**
 * @private
 */
export class TrackedArrayMap<Element = unknown, MappedTo = unknown>
  extends Resource<Args<Element, MappedTo>>
  implements MappedArray<Element[], MappedTo>
{
  // Tells TS that we can array-index-access
  [index: number]: MappedTo;

  #map = new WeakMap<Element & object, MappedTo>();

  @tracked private declare _records: (Element & object)[];
  @tracked private declare _map: (element: Element) => MappedTo;

  modify([data]: Positional<Args<Element, MappedTo>>, { map }: Named<Args<Element, MappedTo>>) {
    assert(
      `Every entry in the data passed to \`map\` must be an object.`,
      data.every((datum) => typeof datum === 'object')
    );
    this._records = data as Array<Element & object>;
    this._map = map;
  }

  values = () => [...this];

  get length() {
    return this._records.length;
  }

  [Symbol.iterator](): Iterator<MappedTo> {
    let i = 0;

    return {
      next: () => {
        if (i >= this.length) {
          return { done: true, value: null };
        }

        let value = this[AT](i);

        i++;

        return {
          value,
          done: false,
        };
      },
    };
  }

  /**
   * @private
   *
   * don't conflict with
   *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at
   */
  [AT](i: number) {
    let record = this._records[i];

    assert(
      `Expected record to exist at index ${i}, but it did not. ` +
        `The array item is expected to exist, because the map utility resource lazily iterates along the indicies of the original array passed as data. ` +
        `This error could happen if the data array passed to map has been mutated while iterating. ` +
        `To resolve this error, do not mutate arrays while iteration occurs.`,
      record
    );

    let value = this.#map.get(record);

    if (!value) {
      value = this._map(record);
      this.#map.set(record, value);
    }

    return value;
  }
}
