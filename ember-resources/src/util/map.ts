import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';

import { Resource } from '../core';

/**
 * Reactivily apply a `map` function to each element in an array,
 * persisting map-results for each object, based on identity.
 *
 * @param {object} [destroyable] parent destroyable context, usually `this`
 * @param {object} [options] object specifying the map function and the data to use
 * @param {(element: Element) => MapTo} [options.map] the map function
 * @param {() => Element[]} [options.data] a thunk that returns the array to map over. This should access tracked data so that the Resources knows when to update.
 *
 * @return {Proxy<TrackedArrayMap>} an object that behaves like an array. This shouldn't be modified directly. Instead, you can freely modify the data returned by the `data` function, which should be tracked in order to benefit from this abstraction.
 *
 * @example
 *
 * ```js
 *  import { map } from 'ember-resources/utils/map';
 *
 *  class MyClass {
 *    wrappedRecords = map(this, {
 *      data: () => this.records,
 *      map: (record) => new SomeWrapper(record),
 *    }),
 *  }
 * ```
 */
export function map<Element = unknown, MapTo = unknown>(
  destroyable: object,
  options: {
    data: () => Element[];
    map: (element: Element) => MapTo;
  }
) {
  let { data, map } = options;

  // Fixing this requires TS 4.7, see notes in Resource.of
  let resource = Resource.of<TrackedArrayMap<Element, MapTo>>(
    destroyable,
    TrackedArrayMap as any,
    () => {
      let reified = data();

      return { positional: [reified], named: { map } };
    }
  );

  /**
   * This is what allows square-bracket index-access to work.
   *
   * Unfortunately this means the returned value is
   * Proxy -> Proxy -> wrapper object -> *then* the class instance
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
  }) as unknown as TrackedArrayMap<Element, MapTo> & {
    [key: number]: MapTo;
  } & Iterable<MapTo>;
}

type PositionalArgs<E = unknown> = [E[]];
interface NamedArgs<E = unknown, Result = unknown> {
  map: (element: E) => Result;
}

const AT = Symbol('__AT__');

export class TrackedArrayMap<Element = unknown, MappedTo = unknown> extends Resource<{
  positional: PositionalArgs<Element>;
  named: NamedArgs<Element, MappedTo>;
}> {
  #map = new WeakMap<Element & object, MappedTo>();

  @tracked private declare _records: (Element & object)[];
  @tracked private declare _map: (element: Element) => MappedTo;

  modify([data]: PositionalArgs<Element>, { map }: NamedArgs<Element, MappedTo>) {
    assert(
      `Every entry in the data passed ta \`map\` must be an object.`,
      data.every((datum) => typeof datum === 'object')
    );
    this._records = data as Array<Element & object>;
    this._map = map;
  }

  /**
   * @public
   *
   * evaluate and return an array of all mapped items
   */
  values = () => [...this];

  // @public
  get length() {
    return this._records.length;
  }

  /**
   * @private
   *
   * don't conflict with
   *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at
   */
  [AT](i: number) {
    let record = this._records[i];
    let value = this.#map.get(record);

    if (!value) {
      value = this._map(record);
      this.#map.set(record, value);
    }

    return value;
  }

  // @public
  [Symbol.iterator]() {
    let i = 0;

    return {
      next: () => {
        if (i >= this.length) {
          return { done: true };
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
}
