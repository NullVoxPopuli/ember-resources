import { c as _classExtractFieldDescriptor, _ as _applyDecoratedDescriptor, b as _classPrivateFieldGet, a as _initializerDefineProperty } from './classPrivateFieldGet-PbDBJaSN.js';
import { _ as _defineProperty } from './defineProperty-oklmLEhu.js';
import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { setHelperManager, capabilities } from '@ember/helper';
import { CURRENT } from './core/function-based/types.js';

function _classApplyDescriptorSet(receiver, descriptor, value) {
  if (descriptor.set) {
    descriptor.set.call(receiver, value);
  } else {
    if (!descriptor.writable) {
      throw new TypeError("attempted to set read only private field");
    }
    descriptor.value = value;
  }
}

function _classPrivateFieldSet(receiver, privateMap, value) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");
  _classApplyDescriptorSet(receiver, descriptor, value);
  return value;
}

var _class2, _descriptor;
function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
var _getter = /*#__PURE__*/new WeakMap();
class ReadonlyCell {
  constructor(getter) {
    _classPrivateFieldInitSpec(this, _getter, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldSet(this, _getter, getter);
  }
  toHTML() {
    assert('Not a valid API. Please access either .current or .read() if the value of this Cell is needed');
  }
  get [CURRENT]() {
    return this.current;
  }
  get current() {
    return _classPrivateFieldGet(this, _getter).call(this);
  }
}
let Cell = (_class2 = class Cell {
  get [CURRENT]() {
    return this.current;
  }
  toHTML() {
    assert('Not a valid API. Please access either .current or .read() if the value of this Cell is needed');
  }
  constructor(initialValue) {
    _initializerDefineProperty(this, "current", _descriptor, this);
    /**
     * Toggles the value of `current` only if
     * `current` is a boolean -- errors otherwise
     */
    _defineProperty(this, "toggle", () => {
      assert(`toggle can only be used when 'current' is a boolean type`, typeof this.current === 'boolean' || this.current === undefined);
      this.current = !this.current;
    });
    /**
     * Updates the value of `current`
     * by calling a function that receives the previous value.
     */
    _defineProperty(this, "update", updater => {
      this.current = updater(this.current);
    });
    /**
     * Updates the value of `current`
     */
    _defineProperty(this, "set", nextValue => {
      this.current = nextValue;
    });
    /**
     * Returns the current value.
     */
    _defineProperty(this, "read", () => this.current);
    if (initialValue !== undefined) {
      this.current = initialValue;
    }
  }
}, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "current", [tracked], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
})), _class2);

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
function cell(initialValue) {
  if (initialValue !== undefined) {
    return new Cell(initialValue);
  }
  return new Cell();
}
class CellManager {
  constructor() {
    _defineProperty(this, "capabilities", capabilities('3.23', {
      hasValue: true
    }));
  }
  createHelper(cell) {
    return cell;
  }
  getValue(cell) {
    return cell.current;
  }
}
const cellEvaluator = new CellManager();
setHelperManager(() => cellEvaluator, Cell.prototype);
setHelperManager(() => cellEvaluator, ReadonlyCell.prototype);

export { Cell as C, ReadonlyCell as R, _classPrivateFieldSet as _, cell as c };
//# sourceMappingURL=cell-8gZlr81z.js.map
