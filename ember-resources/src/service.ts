// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';
// @ts-ignore
import { invokeHelper } from '@ember/helper';
import {
  dependencySatisfies,
  importSync,
  isDevelopingApp,
  isTesting,
  macroCondition,
} from '@embroider/macros';

import { Resource } from './core';
import { INTERNAL } from './core/function-based/types';

import type { InternalFunctionResourceConfig } from './core/function-based/types';
import type { ClassResourceConfig, Stage1DecoratorDescriptor } from '[core-types]';
import type Owner from '@ember/owner';

let getOwner: (context: unknown) => Owner | undefined;

// if (macroCondition(dependencySatisfies('ember-source', '>=4.12.0'))) {
// In no version of ember where `@ember/owner` tried to be imported did it exist
if (macroCondition(false)) {
  // Using 'any' here because importSync can't lookup types correctly
  getOwner = (importSync('@ember/owner') as any).getOwner;
} else {
  // Using 'any' here because importSync can't lookup types correctly
  getOwner = (importSync('@ember/application') as any).getOwner;
}

/**
 * Reminder:
 *   the return value of resource() is different from the returned type (for DX reasons).
 *   the return value is actually a type of InternalFunctionResourceConfig
 */
type ResourceType = InternalFunctionResourceConfig | typeof Resource;

/**
 * In order for the same cache to be used for all references
 * in an app, this variable needs to be in module scope.
 *
 * When the owner is destroyed, the cache is cleared
 * (beacuse the WeakMap will see that nothing is referencing the key (owner) anymore)
 *
 * @internal
 */
export const __secret_service_cache__ = new WeakMap<Owner, Map<ResourceType, any>>();

/**
 * For testing purposes, this allows us to replace a service with a "mock".
 */
const REPLACEMENTS = new WeakMap<Owner, Map<ResourceType, ResourceType>>();

/**
 * An alternative to Ember's built in `@service` decorator.
 *
 * This decorator takes a resource and ties the resource's lifeime to the app / owner.
 *
 * The reason a resource is required, as opposed to allowing "any class", is that a
 * resource already has implemented the concept of "teardown" or "cleanup",
 * and native classes do not have this concept.
 *
 * Example:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { resource } from 'ember-resources';
 * import { service } from 'ember-resources/service';
 *
 * class PlanetsAPI { ... }
 *
 * const Planets = resource(({ on, owner }) => {
 *   let api = new PlanetsAPI(owner); // for further injections
 *
 *   // on cleanup, we want to cancel any pending requests
 *   on.cleanup(() => api.abortAll());
 *
 *   return api;
 * });
 *
 * class Demo extends Component {
 *   @service(Planets) planets;
 * }
 * ```
 *
 * For Stage 1 decorators and typescript, you'll need to manually declare the type:
 * ```ts
 * class Demo extends Component {
 *   @service(Planets) declare planets: Planets;
 * }
 * ```
 */
export function service(resource: unknown) {
  /**
   * In order for resources to be instantiated this way, we need to copy a little bit of code from
   * `@use`, as we still need to rely on `invokeHelper`.
   *
   * The main difference being that instead of using `this` for the parent to `invokeHelper`,
   * we use the owner.
   *
   * BIG NOTE RELATED TO TYPE SAFETY:
   *  - the `resource` argument is typed as `unknown` because the user-land types
   *    are lies so that DX is useful. The actual internal representation of a resource is an object
   *    with some properties with some hints for type narrowing
   */

  // Deliberately separate comment so the above dev-comment doesn't make its way to
  // consumers
  // PropertyDecorator
  return function legacyServiceDecorator(
    _prototype: object,
    key: string,
    descriptor?: Stage1DecoratorDescriptor
  ) {
    if (!descriptor) return;

    assert(`@service(...) can only be used with string-keys`, typeof key === 'string');

    assert(
      `@service(...) may not be used with an initializer. For example, ` +
        `\`@service(MyService) property;\``,
      !descriptor.initializer
    );

    assert(
      `Expected passed resource to be a valid resource definition.`,
      typeof resource === 'function' || (typeof resource === 'object' && resource !== null)
    );

    return {
      get(this: object) {
        let owner = getOwner(this);

        assert(
          `owner was not found on instance of ${this.constructor.name}. ` +
            `Has it been linked up correctly with setOwner?` +
            `If this error has occured in a framework-controlled class, something has gone wrong.`,
          owner
        );

        assert(`Resource definition is invalid`, isResourceType(resource));

        if (macroCondition(isTesting() || isDevelopingApp())) {
          let cachedReplacements = ensureCaches(owner, REPLACEMENTS);

          let replacement = cachedReplacements.get(resource);

          if (replacement) {
            resource = replacement;

            assert(`Replacement Resource definition is invalid`, isResourceType(resource));
          }
        }

        let caches = ensureCaches(owner);
        let cache = caches.get(resource);

        if (!cache) {
          if (INTERNAL in resource && 'type' in resource) {
            assert(
              `When using resources with @service(...), do not call .from() on class-based resources. ` +
                `Resources used as services may not take arguments.`,
              resource.type === 'function-based'
            );

            cache = invokeHelper(owner, resource);
            caches.set(resource, cache);
            associateDestroyableChild(owner, cache);
          } else if ((resource as any).prototype instanceof Resource) {
            assert(
              `The .from() method on a type of Resource has been removed or altered. This is not allowed.`,
              'from' in resource && resource.from === Resource.from
            );

            /**
             * We do a lot of lying internally to make TypeScript nice for consumers.
             * But it does mean that we have to cast in our own code.
             */
            let { definition } = (resource as typeof Resource).from(
              () => []
            ) as unknown as ClassResourceConfig;

            cache = invokeHelper(owner, definition);
            caches.set(resource, cache);
            associateDestroyableChild(owner, cache);
          }
        }

        return getValue(cache);
      },
    } as unknown as void /* thanks, TS. */;
  };
}

function ensureCaches(owner: Owner, cache = __secret_service_cache__) {
  let caches = cache.get(owner);

  if (!caches) {
    caches = new Map();
    cache.set(owner, caches);
  }

  return caches;
}

function isResourceType(resource: unknown): resource is ResourceType {
  // The internal representation of the passed resource will not match its type.
  // A resource is always either a class definition, or the custom internal object.
  // (See the helper managers for details)
  return typeof resource === 'function' || (typeof resource === 'object' && resource !== null);
}

interface RegisterOptions {
  /**
   * The original service to replace.
   */
  original: unknown;
  /**
   * The replacement service to use.
   */
  replacement: unknown;
}

/**
 *
 */
export function serviceOverride(owner: Owner, { original, replacement }: RegisterOptions) {
  if (macroCondition(!isTesting() && !isDevelopingApp())) {
    throw new Error(
      '@service is experimental and `serviceOverride` is not available in production builds.'
    );
  }

  let caches = ensureCaches(owner);

  assert(`Original Resource definition is invalid`, isResourceType(original));
  assert(`Replacement Resource definition is invalid`, isResourceType(replacement));

  assert(`Cannot re-register service after it has been accessed.`, !caches.has(original));

  let replacementCache = ensureCaches(owner, REPLACEMENTS);

  replacementCache.set(original, replacement);
}
