import { tracked } from "@glimmer/tracking";
import { assert } from "@ember/debug";
import { setHelperManager, capabilities, invokeHelper } from "@ember/helper";
import { createCache, getValue } from "@glimmer/tracking/primitives/cache";
import { associateDestroyableChild, destroy, registerDestructor } from "@ember/destroyable";
import { macroCondition, dependencySatisfies, importSync } from "@embroider/macros";
const INTERNAL = "__INTERNAL__";
const CURRENT = Symbol("ember-resources::CURRENT");
var __defProp = Object.defineProperty;
var __decorateClass = (decorators, target, key, kind) => {
  var result = void 0;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = decorator(target, key, result) || result;
  if (result) __defProp(target, key, result);
  return result;
};
class ReadonlyCell {
  #getter;
  constructor(getter) {
    this.#getter = getter;
  }
  toHTML() {
    assert(
      "Not a valid API. Please access either .current or .read() if the value of this Cell is needed"
    );
  }
  get [CURRENT]() {
    return this.current;
  }
  get current() {
    return this.#getter();
  }
}
class Cell {
  get [CURRENT]() {
    return this.current;
  }
  toHTML() {
    assert(
      "Not a valid API. Please access either .current or .read() if the value of this Cell is needed"
    );
  }
  constructor(initialValue) {
    if (initialValue !== void 0) {
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
      typeof this.current === "boolean" || this.current === void 0
    );
    this.current = !this.current;
  };
  /**
   * Updates the value of `current`
   * by calling a function that receives the previous value.
   */
  update = (updater) => {
    this.current = updater(this.current);
  };
  /**
   * Updates the value of `current`
   */
  set = (nextValue) => {
    this.current = nextValue;
  };
  /**
   * Returns the current value.
   */
  read = () => this.current;
}
__decorateClass([
  tracked
], Cell.prototype, "current");
function cell(initialValue) {
  if (initialValue !== void 0) {
    return new Cell(initialValue);
  }
  return new Cell();
}
class CellManager {
  capabilities = capabilities("3.23", {
    hasValue: true
  });
  createHelper(cell2) {
    return cell2;
  }
  getValue(cell2) {
    return cell2.current;
  }
}
const cellEvaluator = new CellManager();
setHelperManager(() => cellEvaluator, Cell.prototype);
setHelperManager(() => cellEvaluator, ReadonlyCell.prototype);
const compatOwner = {};
if (macroCondition(dependencySatisfies("ember-source", ">=4.12.0"))) {
  compatOwner.getOwner = importSync("@ember/owner").getOwner;
  compatOwner.setOwner = importSync("@ember/owner").setOwner;
} else {
  compatOwner.getOwner = importSync("@ember/application").getOwner;
  compatOwner.setOwner = importSync("@ember/application").setOwner;
}
const setOwner$2 = compatOwner.setOwner;
class ResourceInvokerManager {
  constructor(owner) {
    this.owner = owner;
  }
  capabilities = capabilities("3.23", {
    hasValue: true,
    hasDestroyable: true
  });
  createHelper(fn, args) {
    let previous;
    const cache = createCache(() => {
      let resource2 = fn(...args.positional);
      setOwner$2(resource2, this.owner);
      let result = invokeHelper(cache, resource2);
      if (previous) {
        destroy(previous);
      }
      previous = result;
      return result;
    });
    setOwner$2(cache, this.owner);
    return { cache };
  }
  /**
   * getValue is re-called when args change
   */
  getValue({ cache }) {
    let resource2 = getValue(cache);
    associateDestroyableChild(cache, resource2);
    return getValue(resource2);
  }
  getDestroyable({ cache }) {
    return cache;
  }
}
function resourceFactory(wrapperFn) {
  setHelperManager(ResourceInvokerFactory, wrapperFn);
  return wrapperFn;
}
const ResourceInvokerFactory = (owner) => {
  assert(`Cannot create resource without an owner`, owner);
  return new ResourceInvokerManager(owner);
};
const setOwner$1 = compatOwner.setOwner;
class FunctionResourceManager {
  constructor(owner) {
    this.owner = owner;
    setOwner$1(this, owner);
  }
  capabilities = capabilities("3.23", {
    hasValue: true,
    hasDestroyable: true
  });
  /**
   * Resources do not take args.
   * However, they can access tracked data
   */
  createHelper(builder) {
    let instance = builder.create();
    instance.link(this);
    return instance;
  }
  getValue(state) {
    return state.current;
  }
  getDestroyable(state) {
    return state.fn;
  }
}
const ResourceManagerFactory = (owner) => {
  assert(`Cannot create resource without an owner`, owner);
  return new FunctionResourceManager(owner);
};
function shallowFlat(cache) {
  let maybeValue = getValue(cache);
  if (typeof maybeValue === "function") {
    return maybeValue();
  }
  if (isReactive(maybeValue)) {
    return maybeValue[CURRENT];
  }
  return maybeValue;
}
function isReactive(maybe) {
  return typeof maybe === "object" && maybe !== null && CURRENT in maybe;
}
function getCurrentValue(value) {
  if (typeof value === "object" && value !== null && "current" in value) {
    return value.current;
  }
  return value;
}
function use(...args) {
  if (args.length === 3) {
    return initializerDecorator(...args);
  }
  if (args.length === 2) {
    if (typeof args[1] !== "string" && typeof args[1] !== "symbol") {
      return classContextLink(args[0], args[1]);
    }
  }
  if (args.length === 1) {
    return argumentToDecorator(args[0]);
  }
  assert(`Unknown arity for \`use\`. Received ${args.length} arguments`, false);
}
function classContextLink(context, definition) {
  let cache;
  return new ReadonlyCell(() => {
    if (!cache) {
      cache = invokeHelper(context, definition);
      associateDestroyableChild(context, cache);
    }
    let value = getValue(cache);
    return getCurrentValue(value);
  });
}
function argumentToDecorator(definition) {
  return (_prototype, key, descriptor) => {
    if (!descriptor) return;
    assert(`@use can only be used with string-keys`, typeof key === "string");
    assert(
      `When @use(...) is passed a resource, an initialized value is not allowed. \`@use(Clock) time;`,
      !descriptor.initializer
    );
    let newDescriptor = descriptorGetter(definition);
    return newDescriptor;
  };
}
const TYPE_KEY = Symbol.for(`__RESOURCE_TYPE__`);
const USABLES = /* @__PURE__ */ new Map();
function registerUsable(type, useFn) {
  assert(`type may not overlap with an existing usable`, !USABLES.has(type));
  USABLES.set(type, useFn);
}
function descriptorGetter(initializer) {
  let caches = /* @__PURE__ */ new WeakMap();
  return {
    get() {
      let cache = caches.get(this);
      if (!cache) {
        let config = typeof initializer === "function" ? initializer.call(this) : initializer;
        let usable = USABLES.get(config.type) || USABLES.get(config[TYPE_KEY]);
        assert(
          `Expected the initialized value with @use to have been a registerd "usable". Available usables are: ${[
            ...USABLES.keys()
          ]}`,
          usable
        );
        cache = usable(this, config);
        assert(`Failed to create cache for usable: ${config.type}`, cache);
        caches.set(this, cache);
        associateDestroyableChild(this, cache);
      }
      return shallowFlat(cache);
    }
  };
}
function initializerDecorator(_prototype, key, descriptor) {
  if (!descriptor) return;
  assert(`@use can only be used with string-keys`, typeof key === "string");
  let { initializer } = descriptor;
  assert(
    `@use may only be used on initialized properties. For example, \`@use foo = resource(() => { ... })\` or \`@use foo = SomeResource.from(() => { ... });\``,
    initializer
  );
  return descriptorGetter(initializer);
}
const CREATE_KEY = Symbol.for("__configured-resource-key__");
const DEBUG_NAME = Symbol.for("DEBUG_NAME");
const RESOURCE_CACHE = Symbol.for("__resource_cache__");
const getOwner = compatOwner.getOwner;
const setOwner = compatOwner.setOwner;
class Builder {
  #fn;
  [TYPE_KEY] = TYPE;
  constructor(fn, key) {
    assert(
      `Cannot instantiate ConfiguredResource without using the resource() function.`,
      key === CREATE_KEY
    );
    this.#fn = fn;
  }
  create() {
    return new Resource(this.#fn);
  }
}
const TYPE = "function-based";
registerUsable(TYPE, (context, config) => {
  let instance = config.create();
  instance.link(context);
  return instance[RESOURCE_CACHE];
});
class Resource {
  #originalFn;
  #owner;
  #previousFn;
  #usableCache = /* @__PURE__ */ new WeakMap();
  #cache;
  constructor(fn) {
    this.#originalFn = fn.bind(null);
    this.#cache = createCache(() => {
      if (this.#previousFn) {
        destroy(this.#previousFn);
      }
      let currentFn = this.#originalFn.bind(null);
      associateDestroyableChild(this.#originalFn, currentFn);
      this.#previousFn = currentFn;
      assert(
        `Cannot create a resource without an owner. Must have previously called .link()`,
        this.#owner
      );
      let maybeValue = currentFn({
        on: {
          cleanup: (destroyer) => {
            registerDestructor(currentFn, destroyer);
          }
        },
        use: (usable) => {
          assert(
            `Expected the resource's \`use(...)\` utility to have been passed an object, but a \`${typeof usable}\` was passed.`,
            typeof usable === "object"
          );
          assert(
            `Expected the resource's \`use(...)\` utility to have been passed a truthy value, instead was passed: ${usable}.`,
            usable
          );
          assert(
            `Expected the resource's \`use(...)\` utility to have been passed another resource, but something else was passed.`,
            INTERNAL in usable || usable instanceof Builder
          );
          let previousCache = this.#usableCache.get(usable);
          if (previousCache) {
            destroy(previousCache);
          }
          let nestedCache = invokeHelper(this.#cache, usable);
          associateDestroyableChild(currentFn, nestedCache);
          this.#usableCache.set(usable, nestedCache);
          return new ReadonlyCell(() => {
            let cache = this.#usableCache.get(usable);
            assert(`Cache went missing while evaluating the result of a resource.`, cache);
            return getValue(cache);
          });
        },
        owner: this.#owner
      });
      return maybeValue;
    });
  }
  link(context) {
    let owner = getOwner(context);
    assert(`Cannot link without an owner`, owner);
    this.#owner = owner;
    associateDestroyableChild(context, this.#cache);
    associateDestroyableChild(context, this.#originalFn);
    setOwner(this.#cache, this.#owner);
  }
  get [RESOURCE_CACHE]() {
    return this.#cache;
  }
  get fn() {
    return this.#originalFn;
  }
  get current() {
    return shallowFlat(this.#cache);
  }
  [DEBUG_NAME]() {
    return `Resource Function`;
  }
}
setHelperManager(ResourceManagerFactory, Builder.prototype);
function resource(context, setup) {
  if (!setup) {
    assert(
      `When using \`resource\` with @use, the first argument to \`resource\` must be a function. Instead, a ${typeof context} was received.`,
      typeof context === "function"
    );
    return new Builder(
      context,
      CREATE_KEY
    );
  }
  assert(
    `Mismatched argument types passed to \`resource\`. Expected the first arg, the context, to be a type of object. This is usually the \`this\`. Received ${typeof context} instead.`,
    typeof context === "object"
  );
  assert(
    `Mismatched argument type passed to \`resource\`. Expected the second arg to be a function but instead received ${typeof setup}.`,
    typeof setup === "function"
  );
  let configured = new Builder(setup, CREATE_KEY);
  return configured;
}
export {
  cell,
  registerUsable,
  resource,
  resourceFactory,
  use
};
//# sourceMappingURL=index.mjs.map
