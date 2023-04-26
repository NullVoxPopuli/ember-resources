import type Owner from '@ember/owner';

export const INTERMEDIATE_VALUE = '__Intermediate_Value__';
export const INTERNAL = '__INTERNAL__';

export interface InternalFunctionResourceConfig<Value = unknown> {
  definition: ResourceFunction<Value>;
  type: 'function-based';
  [INTERNAL]: true;
}

// Will need to be a class for .current flattening / auto-rendering
export interface Reactive<Value> {
  current: Value;
}

export type Hooks = {
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
  use: <Value>(resource: Value) => Reactive<Value>;
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
  owner: Owner;
};

/**
 * Type of the callback passed to `resource`
 */
export type ResourceFunction<Value = unknown> = (hooks: Hooks) => Value | (() => Value);

/**
 * The perceived return value of `resource`
 * This is a lie to TypeScript, because the effective value of
 * of the resource is the result of the collapsed functions
 * passed to `resource`
 */
export type ResourceFn<Value = unknown> = (hooks: Hooks) => Value;

export type Destructor = () => void;
export type Cache = object;
