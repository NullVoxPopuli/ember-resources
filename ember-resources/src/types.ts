import type Owner from '@ember/owner';
import type { Invoke } from '@glint/template/-private/integration';

export interface Stage1DecoratorDescriptor {
  initializer: () => unknown;
}

export type Stage1Decorator = (
  prototype: object,
  key: string | symbol,
  descriptor?: Stage1DecoratorDescriptor,
) => any;

export const INTERMEDIATE_VALUE = '__Intermediate_Value__';
export const INTERNAL = '__INTERNAL__';

export interface InternalFunctionResourceConfig<Value = unknown> {
  definition: ResourceFunction<Value>;
  type: 'function-based';
  name: string;
  [INTERNAL]: true;
}

export const CURRENT = Symbol('ember-resources::CURRENT') as unknown as 'CURRENT';

export interface GlintRenderable {
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

// Will need to be a class for .current flattening / auto-rendering
export interface Reactive<Value> extends GlintRenderable {
  current: Value;
  [CURRENT]: Value;
  [Invoke]?: Value;
}

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
export type ResourceAPI = {
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
  owner: Owner;
};

/**
 * Type of the callback passed to `resource`
 */
export type ResourceFunction<Value = unknown> = (hooks: ResourceAPI) => Value | (() => Value);

/**
 * The perceived return value of `resource`
 * This is a lie to TypeScript, because the effective value of
 * of the resource is the result of the collapsed functions
 * passed to `resource`
 */
export type ResourceFn<Value = unknown> = (hooks: ResourceAPI) => Value;

export type Destructor = () => void;
export type Cache = object;
