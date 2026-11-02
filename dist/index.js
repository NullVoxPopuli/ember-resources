import { tracked } from "@glimmer/tracking";
import { assert } from "@ember/debug";
import { capabilities, invokeHelper, setHelperManager } from "@ember/helper";
import { createCache, getValue } from "@glimmer/tracking/primitives/cache";
import { associateDestroyableChild, destroy, registerDestructor } from "@ember/destroyable";
import { appEmberSatisfies, importSync, macroCondition } from "@embroider/macros";
// \0@oxc-project+runtime@0.156.0/helpers/esm/decorate.js
function __decorate(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
}
// src/types.ts
var INTERMEDIATE_VALUE = "__Intermediate_Value__";
var INTERNAL = "__INTERNAL__";
var CURRENT = Symbol("ember-resources::CURRENT");
// src/cell.ts
var ReadonlyCell = class {
	#getter;
	constructor(getter) {
		this.#getter = getter;
	}
	toHTML() {
		assert("Not a valid API. Please access either .current or .read() if the value of this Cell is needed");
	}
	get [CURRENT]() {
		return this.current;
	}
	get current() {
		return this.#getter();
	}
};
var Cell = class {
	get [CURRENT]() {
		return this.current;
	}
	toHTML() {
		assert("Not a valid API. Please access either .current or .read() if the value of this Cell is needed");
	}
	constructor(initialValue) {
		if (initialValue !== void 0) this.current = initialValue;
	}
	/**
	* Toggles the value of `current` only if
	* `current` is a boolean -- errors otherwise
	*/
	toggle = () => {
		assert(`toggle can only be used when 'current' is a boolean type`, typeof this.current === "boolean" || this.current === void 0);
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
};
__decorate([tracked], Cell.prototype, "current", void 0);
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
	if (initialValue !== void 0) return new Cell(initialValue);
	return new Cell();
}
var CellManager = class {
	capabilities = capabilities("3.23", { hasValue: true });
	createHelper(cell) {
		return cell;
	}
	getValue(cell) {
		return cell.current;
	}
};
var cellEvaluator = new CellManager();
setHelperManager(() => cellEvaluator, Cell.prototype);
setHelperManager(() => cellEvaluator, ReadonlyCell.prototype);
// src/ember-compat.ts
var compatOwner = {};
if (macroCondition(appEmberSatisfies(">=4.12.0"))) {
	compatOwner.getOwner = importSync("@ember/owner").getOwner;
	compatOwner.setOwner = importSync("@ember/owner").setOwner;
} else {
	compatOwner.getOwner = importSync("@ember/application").getOwner;
	compatOwner.setOwner = importSync("@ember/application").setOwner;
}
// src/immediate-invocation-manager.ts
var setOwner$1 = compatOwner.setOwner;
var ResourceInvokerManager = class {
	owner;
	capabilities = capabilities("3.23", {
		hasValue: true,
		hasDestroyable: true
	});
	constructor(owner) {
		this.owner = owner;
	}
	createHelper(fn, args) {
		let previous;
		/**
		* This cache is for args passed to the ResourceInvoker/Factory
		*
		* We want to cache the helper result, and only re-inoke when the args
		* change.
		*/
		const cache = createCache(() => {
			let resource = fn(...[...args.positional, args.named]);
			setOwner$1(resource, this.owner);
			let result = invokeHelper(cache, resource);
			if (previous) destroy(previous);
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
		let resource = getValue(cache);
		associateDestroyableChild(cache, resource);
		return getValue(resource);
	}
	getDestroyable({ cache }) {
		/**
		* This is the parent cache, from `createHelper`
		*/
		return cache;
	}
};
/**
* Allows wrapper functions to provide a [[resource]] for use in templates.
*
* Only library authors may care about this, but helper function is needed to "register"
* the wrapper function with a helper manager that specifically handles invoking both the
* resource wrapper function as well as the underlying resource.
*
* _App-devs / consumers may not ever need to know this utility function exists_
*
*  Example using strict mode + `<template>` syntax and a template-only component:
*  ```js
*  import { resource, resourceFactory } from 'ember-resources';
*
*  function RemoteData(url) {
*    return resource(({ on }) => {
*      let state = new TrackedObject({});
*      let controller = new AbortController();
*
*      on.cleanup(() => controller.abort());
*
*      fetch(url, { signal: controller.signal })
*        .then(response => response.json())
*        .then(data => {
*          state.value = data;
*        })
*        .catch(error => {
*          state.error = error;
*        });
*
*      return state;
*    })
* }
*
* resourceFactory(RemoteData);
*
*  <template>
*    {{#let (RemoteData "http://....") as |state|}}
*      {{#if state.value}}
*        ...
*      {{else if state.error}}
*        {{state.error}}
*      {{/if}}
*    {{/let}}
*  </template>
*  ```
*
*  Alternatively, `resourceFactory` can wrap the wrapper function.
*
*  ```js
*  const RemoteData = resourceFactory((url) => {
*    return resource(({ on }) => {
*      ...
*    });
*  })
*  ```
*/
function resourceFactory(wrapperFn) {
	setHelperManager(ResourceInvokerFactory, wrapperFn);
	return wrapperFn;
}
var ResourceInvokerFactory = (owner) => {
	assert(`Cannot create resource without an owner`, owner);
	return new ResourceInvokerManager(owner);
};
// src/resource-manager.ts
var setOwner = compatOwner.setOwner;
/**
* `tracked(initialValue)` from `@glimmer/tracking` creates a standalone
* reactive value -- an instance of `TrackedValue` from `@glimmer/validator`.
* These unwrap when returned from a resource, the same way `Cell`s do.
*/
var TrackedValue;
if (macroCondition(appEmberSatisfies(">=7.3.0-alpha.2"))) TrackedValue = importSync("@glimmer/validator").TrackedValue;
/**
* Note, a function-resource receives on object, hooks.
*    We have to build that manually in this helper manager
*/
var FunctionResourceManager = class {
	owner;
	capabilities = capabilities("3.23", {
		hasValue: true,
		hasDestroyable: true
	});
	constructor(owner) {
		this.owner = owner;
	}
	/**
	* Resources do not take args.
	* However, they can access tracked data
	*/
	createHelper(config) {
		let { definition: fn } = config;
		/**
		* We have to copy the `fn` in case there are multiple
		* usages or invocations of the function.
		*
		* This copy is what we'll ultimately work with and eventually
		* destroy.
		*/
		let thisFn = fn.bind(null);
		let previousFn;
		let usableCache = /* @__PURE__ */ new WeakMap();
		let owner = this.owner;
		let cache = createCache(() => {
			if (previousFn) destroy(previousFn);
			let currentFn = thisFn.bind(null);
			associateDestroyableChild(thisFn, currentFn);
			previousFn = currentFn;
			return currentFn({
				on: { cleanup: (destroyer) => {
					registerDestructor(currentFn, destroyer);
				} },
				use: (usable) => {
					assert(`Expected the resource's \`use(...)\` utility to have been passed an object, but a \`${typeof usable}\` was passed.`, typeof usable === "object");
					assert(`Expected the resource's \`use(...)\` utility to have been passed a truthy value, instead was passed: ${usable}.`, usable);
					assert(`Expected the resource's \`use(...)\` utility to have been passed another resource, but something else was passed.`, INTERNAL in usable);
					let previousCache = usableCache.get(usable);
					if (previousCache) destroy(previousCache);
					let nestedCache = invokeHelper(cache, usable);
					associateDestroyableChild(currentFn, nestedCache);
					usableCache.set(usable, nestedCache);
					return new ReadonlyCell(() => {
						let cache = usableCache.get(usable);
						assert(`Cache went missing while evaluating the result of a resource.`, cache);
						return getValue(cache);
					});
				},
				owner: this.owner
			});
		});
		setOwner(cache, owner);
		return {
			fn: thisFn,
			cache
		};
	}
	getValue({ cache }) {
		let maybeValue = getValue(cache);
		if (typeof maybeValue === "function") return maybeValue();
		if (isReactive(maybeValue)) return maybeValue[CURRENT];
		if (TrackedValue && maybeValue instanceof TrackedValue) return maybeValue.value;
		return maybeValue;
	}
	getDestroyable({ fn }) {
		return fn;
	}
};
function isReactive(maybe) {
	return typeof maybe === "object" && maybe !== null && CURRENT in maybe;
}
var ResourceManagerFactory = (owner) => {
	assert(`Cannot create resource without an owner`, owner);
	return new FunctionResourceManager(owner);
};
// src/use.ts
function use(...args) {
	if (args.length === 3) return initializerDecorator(...args);
	if (args.length === 2) {
		if (typeof args[1] !== "string" && typeof args[1] !== "symbol") return classContextLink(args[0], args[1]);
	}
	if (args.length === 1) return argumentToDecorator(args[0]);
	assert(`Unknown arity for \`use\`. Received ${args.length} arguments`, false);
}
function getCurrentValue(value) {
	/**
	* If we are working with a cell, forward the '.current' call to it.
	*/
	if (typeof value === "object" && value !== null && "current" in value) return value.current;
	return value;
}
function classContextLink(context, definition) {
	let cache;
	return new ReadonlyCell(() => {
		if (!cache) {
			cache = invokeHelper(context, definition);
			associateDestroyableChild(context, cache);
		}
		return getCurrentValue(getValue(cache));
	});
}
function argumentToDecorator(definition) {
	return (_prototype, key, descriptor) => {
		if (!descriptor) return;
		assert(`@use can only be used with string-keys`, typeof key === "string");
		assert("When @use(...) is passed a resource, an initialized value is not allowed. `@use(Clock) time;", !descriptor.initializer);
		return descriptorGetter(definition);
	};
}
var USABLES = /* @__PURE__ */ new Map();
/**
* Register with the usable system.
* This is only needed for for the `@use` decorator, as use(this, Helper) is a concise wrapper
* around the helper-manager system.
*
* The return type must be a "Cache" returned from `invokeHelper` so that `@use`'s usage of `getValue` gets the value (as determined by the helper manager you wrote for your usable).
*/
function registerUsable(type, useFn) {
	assert(`type may not overlap with an existing usable`, !USABLES.has(type));
	USABLES.set(type, useFn);
}
function descriptorGetter(initializer) {
	let caches = /* @__PURE__ */ new WeakMap();
	return { get() {
		let cache = caches.get(this);
		if (!cache) {
			let config = typeof initializer === "function" ? initializer.call(this) : initializer;
			let usable = USABLES.get(config.type);
			assert(`Expected the initialized value with @use to have been a registerd "usable". Available usables are: ${[...USABLES.keys()]}`, usable);
			cache = usable(this, config);
			assert(`Failed to create cache for usable: ${config.type}`, cache);
			caches.set(this, cache);
			associateDestroyableChild(this, cache);
		}
		return getCurrentValue(getValue(cache));
	} };
}
function initializerDecorator(_prototype, key, descriptor) {
	if (!descriptor) return;
	assert(`@use can only be used with string-keys`, typeof key === "string");
	let { initializer } = descriptor;
	assert("@use may only be used on initialized properties. For example, `@use foo = resource(() => { ... })` or `@use foo = SomeResource.from(() => { ... });`", initializer);
	return descriptorGetter(initializer);
}
// src/utils.ts
/**
* This is what allows resource to be used withotu @use.
* The caveat though is that a property must be accessed
* on the return object.
*
* A resource not using use *must* be an object.
*/
function wrapForPlainUsage(context, setup) {
	let cache;
	/**
	* This proxy takes everything called on or accessed on "target"
	* and forwards it along to target[INTERMEDIATE_VALUE] (where the actual resource instance is)
	*
	* It's important to only access .[INTERMEDIATE_VALUE] within these proxy-handler methods so that
	* consumers "reactively entangle with" the Resource.
	*/
	return new Proxy({ get [INTERMEDIATE_VALUE]() {
		if (!cache) cache = invokeHelper(context, setup);
		return getValue(cache);
	} }, {
		get(target, key) {
			const state = target[INTERMEDIATE_VALUE];
			assert("[BUG]: it should not have been possible for this to be undefined", state);
			return Reflect.get(state, key, state);
		},
		ownKeys(target) {
			const value = target[INTERMEDIATE_VALUE];
			assert("[BUG]: it should not have been possible for this to be undefined", value);
			return Reflect.ownKeys(value);
		},
		getOwnPropertyDescriptor(target, key) {
			const value = target[INTERMEDIATE_VALUE];
			assert("[BUG]: it should not have been possible for this to be undefined", value);
			return Reflect.getOwnPropertyDescriptor(value, key);
		}
	});
}
// src/resource.ts
var TYPE = "function-based";
registerUsable(TYPE, (context, config) => {
	return invokeHelper(context, config);
});
/**
*/
function resource(context, setup) {
	if (!setup) {
		assert(`When using \`resource\` with @use, the first argument to \`resource\` must be a function. Instead, a ${typeof context} was received.`, typeof context === "function");
		let internalConfig = {
			definition: context,
			type: "function-based",
			name: "Resource",
			[INTERNAL]: true
		};
		/**
		* Functions have a different identity every time they are defined.
		* The primary purpose of the `resource` wrapper is to individually
		* register each function with our helper manager.
		*/
		setHelperManager(ResourceManagerFactory, internalConfig);
		/**
		* With only one argument, we have to do a bunch of lying to
		* TS, because we need a special object to pass to `@use`
		*
		* Add secret key to help @use assert against
		* using vanilla functions as resources without the resource wrapper
		*
		*/
		return internalConfig;
	}
	assert(`Mismatched argument types passed to \`resource\`. Expected the first arg, the context, to be a type of object. This is usually the \`this\`. Received ${typeof context} instead.`, typeof context === "object");
	assert(`Mismatched argument type passed to \`resource\`. Expected the second arg to be a function but instead received ${typeof setup}.`, typeof setup === "function");
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
	if ("name" in obj) return `Resource Function: ${obj.name}`;
	return `Resource Function`;
}
export { cell, registerUsable, resource, resourceFactory, use };

//# sourceMappingURL=index.mjs.map