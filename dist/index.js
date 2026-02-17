import { tracked } from "@glimmer/tracking";
import { assert } from "@ember/debug";
import { setHelperManager, capabilities, invokeHelper } from "@ember/helper";
import { createCache, getValue } from "@glimmer/tracking/primitives/cache";
import { associateDestroyableChild, destroy, registerDestructor } from "@ember/destroyable";
import { macroCondition, dependencySatisfies, importSync } from "@embroider/macros";
const INTERMEDIATE_VALUE = "__Intermediate_Value__";
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
const setOwner$1 = compatOwner.setOwner;
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
      let resource2 = fn(...[...args.positional, args.named]);
      setOwner$1(resource2, this.owner);
      let result = invokeHelper(cache, resource2);
      if (previous) {
        destroy(previous);
      }
      previous = result;
      return result;
    });
    setOwner$1(cache, this.owner);
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
const setOwner = compatOwner.setOwner;
class FunctionResourceManager {
  constructor(owner) {
    this.owner = owner;
  }
  capabilities = capabilities("3.23", {
    hasValue: true,
    hasDestroyable: true
  });
  /**
   * Resources do not take args.
   * However, they can access tracked data
   */
  createHelper(config) {
    let { definition: fn } = config;
    let thisFn = fn.bind(null);
    let previousFn;
    let usableCache = /* @__PURE__ */ new WeakMap();
    let owner = this.owner;
    let cache = createCache(() => {
      if (previousFn) {
        destroy(previousFn);
      }
      let currentFn = thisFn.bind(null);
      associateDestroyableChild(thisFn, currentFn);
      previousFn = currentFn;
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
            INTERNAL in usable
          );
          let previousCache = usableCache.get(usable);
          if (previousCache) {
            destroy(previousCache);
          }
          let nestedCache = invokeHelper(cache, usable);
          associateDestroyableChild(currentFn, nestedCache);
          usableCache.set(usable, nestedCache);
          return new ReadonlyCell(() => {
            let cache2 = usableCache.get(usable);
            assert(`Cache went missing while evaluating the result of a resource.`, cache2);
            return getValue(cache2);
          });
        },
        owner: this.owner
      });
      return maybeValue;
    });
    setOwner(cache, owner);
    return { fn: thisFn, cache };
  }
  getValue({ cache }) {
    let maybeValue = getValue(cache);
    if (typeof maybeValue === "function") {
      return maybeValue();
    }
    if (isReactive(maybeValue)) {
      return maybeValue[CURRENT];
    }
    return maybeValue;
  }
  getDestroyable({ fn }) {
    return fn;
  }
}
function isReactive(maybe) {
  return typeof maybe === "object" && maybe !== null && CURRENT in maybe;
}
const ResourceManagerFactory = (owner) => {
  assert(`Cannot create resource without an owner`, owner);
  return new FunctionResourceManager(owner);
};
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
function getCurrentValue(value) {
  if (typeof value === "object" && value !== null && "current" in value) {
    return value.current;
  }
  return value;
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
        let usable = USABLES.get(config.type);
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
      let value = getValue(cache);
      return getCurrentValue(value);
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
function wrapForPlainUsage(context, setup) {
  let cache;
  const target = {
    get [INTERMEDIATE_VALUE]() {
      if (!cache) {
        cache = invokeHelper(context, setup);
      }
      return getValue(cache);
    }
  };
  return new Proxy(target, {
    get(target2, key) {
      const state = target2[INTERMEDIATE_VALUE];
      assert("[BUG]: it should not have been possible for this to be undefined", state);
      return Reflect.get(state, key, state);
    },
    ownKeys(target2) {
      const value = target2[INTERMEDIATE_VALUE];
      assert("[BUG]: it should not have been possible for this to be undefined", value);
      return Reflect.ownKeys(value);
    },
    getOwnPropertyDescriptor(target2, key) {
      const value = target2[INTERMEDIATE_VALUE];
      assert("[BUG]: it should not have been possible for this to be undefined", value);
      return Reflect.getOwnPropertyDescriptor(value, key);
    }
  });
}
const TYPE = "function-based";
registerUsable(TYPE, (context, config) => {
  return invokeHelper(context, config);
});
function resource(context, setup) {
  if (!setup) {
    assert(
      `When using \`resource\` with @use, the first argument to \`resource\` must be a function. Instead, a ${typeof context} was received.`,
      typeof context === "function"
    );
    let internalConfig2 = {
      definition: context,
      type: "function-based",
      name: "Resource",
      [INTERNAL]: true
    };
    setHelperManager(ResourceManagerFactory, internalConfig2);
    return internalConfig2;
  }
  assert(
    `Mismatched argument types passed to \`resource\`. Expected the first arg, the context, to be a type of object. This is usually the \`this\`. Received ${typeof context} instead.`,
    typeof context === "object"
  );
  assert(
    `Mismatched argument type passed to \`resource\`. Expected the second arg to be a function but instead received ${typeof setup}.`,
    typeof setup === "function"
  );
  let internalConfig = {
    definition: setup,
    type: TYPE,
    name: getDebugName(setup),
    [INTERNAL]: true
  };
  setHelperManager(ResourceManagerFactory, internalConfig);
  return wrapForPlainUsage(context, internalConfig);
}
function getDebugName(obj) {
  if ("name" in obj) {
    return `Resource Function: ${obj.name}`;
  }
  return `Resource Function`;
}
export {
  cell,
  registerUsable,
  resource,
  resourceFactory,
  use
};
//# sourceMappingURL=index.mjs.map
