import { _ as _applyDecoratedDescriptor, a as _initializerDefineProperty, b as _classPrivateFieldGet } from '../classPrivateFieldGet-PbDBJaSN.js';
import { _ as _defineProperty } from '../defineProperty-oklmLEhu.js';
import { tracked } from '@glimmer/tracking';
import { deprecate, assert } from '@ember/debug';
import '../core/class-based/manager.js';
import { Resource } from '../core/class-based/resource.js';

let _Symbol$iterator;
var _class, _descriptor, _descriptor2, _map;
function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
deprecate(`importing from 'ember-resources/util/map' is deprecated and will be removed in ember-resources@v7. ` + `The exact same code and support is available at https://github.com/universal-ember/reactiveweb. ` + `\`pnpm add reactiveweb\` and then \` import { map } from 'reactiveweb/map';\`. ` + `See also: https://github.com/NullVoxPopuli/ember-resources/issues/1061`, false, {
  id: `ember-resources.util.map`,
  until: `7.0.0`,
  for: `ember-resources`,
  url: `https://reactive.nullvoxpopuli.com/functions/map.map.html`,
  since: {
    available: '6.4.4',
    enabled: '6.4.4'
  }
});

/**
 * Public API of the return value of the [[map]] resource.
 */

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
function map(
/**
 * parent destroyable context, usually `this`
 */
destroyable, options) {
  let {
    data,
    map
  } = options;

  // parens required, else ESLint and TypeScript/Glint error here
  // prettier-ignore
  let resource = TrackedArrayMap.from(destroyable, () => {
    let reified = data();
    return {
      positional: [reified],
      named: {
        map
      }
    };
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
    }
    // Is there a way to do this without lying to TypeScript?
  });
}

const AT = Symbol('__AT__');

/**
 * @private
 */
let TrackedArrayMap = (_class = (_map = /*#__PURE__*/new WeakMap(), _Symbol$iterator = Symbol.iterator, class TrackedArrayMap extends Resource {
  constructor(...args) {
    super(...args);
    _classPrivateFieldInitSpec(this, _map, {
      writable: true,
      value: new WeakMap()
    });
    _initializerDefineProperty(this, "_records", _descriptor, this);
    _initializerDefineProperty(this, "_map", _descriptor2, this);
    _defineProperty(this, "values", () => [...this]);
  } // Tells TS that we can array-index-access
  modify([data], {
    map
  }) {
    assert(`Every entry in the data passed to \`map\` must be an object.`, data.every(datum => typeof datum === 'object'));
    this._records = data;
    this._map = map;
  }
  get length() {
    return this._records.length;
  }
  [_Symbol$iterator]() {
    let i = 0;
    return {
      next: () => {
        if (i >= this.length) {
          return {
            done: true,
            value: null
          };
        }
        let value = this[AT](i);
        i++;
        return {
          value,
          done: false
        };
      }
    };
  }

  /**
   * @private
   *
   * don't conflict with
   *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at
   */
  [AT](i) {
    let record = this._records[i];
    assert(`Expected record to exist at index ${i}, but it did not. ` + `The array item is expected to exist, because the map utility resource lazily iterates along the indices of the original array passed as data. ` + `This error could happen if the data array passed to map has been mutated while iterating. ` + `To resolve this error, do not mutate arrays while iteration occurs.`, record);
    let value = _classPrivateFieldGet(this, _map).get(record);
    if (!value) {
      value = this._map(record);
      _classPrivateFieldGet(this, _map).set(record, value);
    }
    return value;
  }
}), (_descriptor = _applyDecoratedDescriptor(_class.prototype, "_records", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "_map", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
})), _class);

export { TrackedArrayMap, map };
//# sourceMappingURL=map.js.map
