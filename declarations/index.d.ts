import { default as default_2 } from '@ember/owner';
import { Invoke } from '@glint/template/-private/integration';

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
export declare function cell<Value = unknown>(initialValue?: Value): Cell<Value>;

declare const CURRENT: "CURRENT";

declare type DecoratorKey<K> = K extends string | symbol ? K : never;

declare type Destructor = () => void;

declare interface GlintRenderable {
    /**
     * Cells aren't inherently understood by Glint,
     * so to work around that, we'll hook in to the fact that
     * ContentValue (the type expected for all renderables),
     * defines an interface with this signature.
     *
     * (SafeString)
     *
     * There *has* been interest in the community to formally support
     * toString and toHTML APIs across all objects. An RFC needs to be
     * written so that we can gather feedback / potential problems.
     */
    toHTML(): string;
}

declare type NonInstanceType<K> = K extends InstanceType<any> ? object : K;

export declare interface Reactive<Value> extends GlintRenderable {
    current: Value;
    [CURRENT]: Value;
    [Invoke]?: Value;
}

/**
 * Register with the usable system.
 * This is only needed for for the `@use` decorator, as use(this, Helper) is a concise wrapper
 * around the helper-manager system.
 *
 * The return type must be a "Cache" returned from `invokeHelper` so that `@use`'s usage of `getValue` gets the value (as determined by the helper manager you wrote for your usable).
 */
export declare function registerUsable<Usable extends UsableConfig>(
/**
 * The key to register the usable under.
 *
 * All usables must have a `type`.
 *
 * Any usable matching the registered type will used the passed function to
 *   create its Cache -- this is typically the return result of `invokeHelper`,
 *
 * Any usables must have a `type` property matching this string
 */
type: string, 
/**
 * Receives the the parent context and object passed to the `@use` decorator.
 */
useFn: UsableFn<Usable>): void;

/**
 * `resource` provides a single reactive read-only value with lifetime and may have cleanup.
 *
 * Arguments passed to the `resource` function:
 * ```js
 *  resource(
 *    ({
 *      // provided callback functions:
 *      //  - `cleanup`
 *      on,
 *
 *      // used for composing other resources
 *      use,
 *
 *      // used for accessing services, etc on the app/engine owner instance
 *      owner
 *    }) => {
 *      // ✂️  resource body ✂️
 *    }
 *  );
 *  ```
 *
 *  Example using `fetch` + `AbortController`
 *  ```js
 *  import { use, resource } from 'ember-resources';
 *  import { TrackedObject } from 'tracked-built-ins';
 *  import { tracked } from '@glimmer/tracking';
 *
 *  class Demo {
 *    @tracked url = '...';
 *
 *    @use myData = resource(({ on }) => {
 *      let state = new TrackedObject({ ... });
 *
 *      let controller = new AbortController();
 *
 *      on.cleanup(() => controller.abort());
 *
 *      // because this.url is tracked, anytime url changes,
 *      // this resource will re-run
 *      fetch(this.url, { signal: controller.signal })
 *        .then(response => response.json())
 *        .then(data => {
 *          state.value = data;
 *          // ...
 *        })
 *        .catch(error => {
 *          state.error = error;
 *          // ...
 *        });
 *      // Note that this fetch request could be written async by wrapping in an
 *      // immediately invoked async function, e.g: (async () => {})()
 *
 *
 *      return state;
 *    })
 *  }
 *  ```
 *
 *
 *
 *  Example using strict mode + `<template>` syntax and a template-only component:
 *
 *  ```js
 *  import { resource } from 'ember-resources';
 *  import { TrackedObject } from 'tracked-built-ins';
 *
 *  const load = resource(({ on }) => {
 *    let state = new TrackedObject({});
 *    let controller = new AbortController();
 *
 *    on.cleanup(() => controller.abort());
 *
 *    fetch(this.url, { signal: controller.signal })
 *      .then(response => response.json())
 *      .then(data => {
 *        state.value = data;
 *      })
 *      .catch(error => {
 *        state.error = error;
 *      });
 *
 *    return state;
 *  })
 *
 *  <template>
 *    {{#let (load) as |state|}}
 *      {{#if state.value}}
 *        ...
 *      {{else if state.error}}
 *        {{state.error}}
 *      {{/if}}
 *    {{/let}}
 *  </template>
 *  ```
 */
export declare function resource<Value>(setup: ResourceFunction<Value>): Value;

/**
 * `resource` is an alternative API to the class-based `Resource`.
 * It may provide a single read-only value and provides a way to optionally cleanup.
 *
 * When would you reach for the class-based `Resource`?
 *  - the capabilities of the function-based resource and class-based resource are identical,
 *    with the exception that function-based resources may represent a single value, rather than
 *    an object with properties/methods (the only option with class-based resources)
 *
 * A function-resource
 *  - _must_ return a value.
 *  - cannot, itself, be async - but can interact with promises and update a value
 *
 *  Example using `fetch` + `AbortController`
 *  ```js
 *  import { resource } from 'ember-resources';
 *  import { TrackedObject } from 'tracked-built-ins';
 *  import { tracked } from '@glimmer/tracking';
 *
 *  class Demo {
 *    @tracked url = '...';
 *
 *    myData = resource(this, ({ on }) => {
 *      let state = new TrackedObject({ isResolved: false, isLoading: true, isError: false });
 *
 *      let controller = new AbortController();
 *
 *      on.cleanup(() => controller.abort());
 *
 *      // because this.url is tracked, anytime url changes,
 *      // this resource will re-run
 *      fetch(this.url, { signal: controller.signal })
 *        .then(response => response.json())
 *        .then(data => {
 *          state.value = data;
 *          state.isResolved = true;
 *          state.isLoading = false;
 *          state.isError = false;
 *        })
 *        .catch(error => {
 *          state.error = error;
 *          state.isResolved = true;
 *          state.isLoading = false;
 *          state.isError = true;
 *        });
 *      // Note that this fetch request could be written async by wrapping in an
 *      // immediately invoked async function, e.g: (async () => {})()
 *
 *
 *      return state;
 *    })
 *  }
 *  ```
 */
export declare function resource<Value>(context: object, setup: ResourceFunction<Value>): Value;

/**
 * This is the type of the arguments passed to the `resource` function
 *
 * ```ts
 * import { resource, type ResourceAPI } from 'ember-resources';
 *
 * export const Clock = resource((api: ResourceAPI) => {
 *   let { on, use, owner } = api;
 *
 *   // ...
 * })
 * ```
 */
export declare type ResourceAPI = {
    on: {
        /**
         * Optionally a function-resource can provide a cleanup function.
         *
         *
         *  Example:
         *  ```js
         *  import { resource } from 'ember-resources';
         *  import { TrackedObject } from 'tracked-built-ins';
         *
         *  const load = resource(({ on }) => {
         *    let state = new TrackedObject({});
         *    let controller = new AbortController();
         *
         *    on.cleanup(() => controller.abort());
         *
         *    fetch(this.url, { signal: controller.signal })
         *      // ...
         *
         *    return state;
         *  })
         */
        cleanup: (destroyer: Destructor) => void;
    };
    /**
     * Allows for composition of resources.
     *
     * Example:
     * ```js
     * let formatter = new Intl.DateTimeFormat("en-US", {
     *   hour: "numeric",
     *   minute: "numeric",
     *   second: "numeric",
     *   hour12: false,
     * });
     * let format = (time: Reactive<Date>) => formatter.format(time.current);
     *
     * const Now = resource(({ on }) => {
     *    let now = cell(nowDate);
     *    let timer = setInterval(() => now.set(Date.now()), 1000);
     *
     *    on.cleanup(() => clearInterval(timer));
     *
     *    return () => now.current;
     *  });
     *
     *  const Stopwatch = resource(({ use }) => {
     *    let time = use(Now);
     *
     *     return () => format(time);
     *  });
     * ```
     */
    use: <Value>(resource: Value) => Reactive<Value extends Reactive<any> ? Value['current'] : Value>;
    /**
     * The Application owner.
     * This allows for direct access to traditional ember services.
     *
     * Example:
     * ```js
     * resource(({ owner }) => {
     *   owner.lookup('service:router').currentRouteName
     *  //...
     * }
     * ```
     */
    owner: default_2;
};

declare type ResourceBlueprint<Value, Args> = 
/**
* Type for template invocation
*  {{#let (A b c d) as |a|}}
*     {{a}}
*  {{/let}}
*
* This could also be used in JS w/ invocation with @use
*   @use a = A(() => b)
*
* NOTE: it is up to the function passed to resourceFactory to handle some of the parameter ambiguity
*/
((...args: SpreadFor<Args>) => ReturnType<typeof resource<Value>>)
/**
* Not passing args is allowed, too
*   @use a = A()
*
*   {{A}}
*/
| (() => ReturnType<typeof resource<Value>>);

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
export declare function resourceFactory<Value = unknown, Args extends any[] = any[]>(wrapperFn: (...args: Args) => ReturnType<typeof resource<Value>>): ResourceBlueprint<Value, Args>;

/**
 * Type of the callback passed to `resource`
 */
declare type ResourceFunction<Value = unknown> = (hooks: ResourceAPI) => Value | (() => Value);

declare type SpreadFor<T> = T extends Array<any> ? T : [T];

declare interface Stage1DecoratorDescriptor {
    initializer: () => unknown;
}

declare interface UsableConfig {
    type: string;
    definition: unknown;
}

declare type UsableFn<Usable extends UsableConfig> = (context: object, config: Usable) => unknown;

/**
 * The `@use(...)` decorator can be used to use a Resource in javascript classes
 *
 * ```js
 * import { resource, use } from 'ember-resources';
 *
 * const Clock = resource( ... );
 *
 * class Demo {
 *   @use(Clock) time;
 * }
 * ```
 */
export declare function use<Value>(definition: Value | (() => Value)): PropertyDecorator;

/**
 * The `@use` decorator can be used to use a Resource in javascript classes
 *
 * ```js
 * import { resource, use } from 'ember-resources';
 *
 * const Clock = resource(() => 2);
 *
 * class MyClass {
 *   @use data = Clock;
 * }
 *
 * (new MyClass()).data === 2
 * ```
 */
export declare function use<Prototype, Key>(prototype: NonInstanceType<Prototype>, key: DecoratorKey<Key>, descriptor?: Stage1DecoratorDescriptor): void;

/**
 * The `use function can be used to use a Resource in javascript classes
 *
 * Note that when using this version of `use`, the value is only accessible on the `current`
 * property.
 *
 * ```js
 * import { resource, use } from 'ember-resources';
 *
 * const Clock = resource( ... );
 *
 * class Demo {
 *   data = use(this, Clock);
 * }
 *
 * (new Demo()).data.current === 2
 * ```
 */
export declare function use<Value>(parent: object, definition: Value | (() => Value), _?: never): Reactive<Value extends Reactive<any> ? Value['current'] : Value>;

export { }
