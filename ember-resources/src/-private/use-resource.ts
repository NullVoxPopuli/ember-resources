/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import { LifecycleResource } from './resources/lifecycle';
import { Resource } from './resources/simple';
import { DEFAULT_THUNK, normalizeThunk, proxyClass } from './utils';

import type { ResourceFn } from './resources/function-runner';
import type { Cache, Constructable, Thunk } from './types';

// https://github.com/josemarluedke/glimmer-apollo/blob/main/packages/glimmer-apollo/src/-private/use-resource.ts
function useUnproxiedResource<Instance = unknown>(
  context: object,
  klass: Constructable<Instance>,
  thunk: Thunk
): { value: Instance } {
  let resource: Cache<Instance>;

  return {
    get value(): Instance {
      if (!resource) {
        resource = invokeHelper(context, klass, () => {
          return normalizeThunk(thunk);
        }) as Cache<Instance>;
      }

      return getValue<Instance>(resource)!; // eslint-disable-line
    },
  };
}

/**
 * For use in the body of a class.
 *
 * `useResource` takes either a [[Resource]] or [[LifecycleResource]] and an args [[Thunk]].
 *
 * `useResource` is what allows _Resources_ to be used in JS, they hide the reactivity APIs
 * from the consumer so that the surface API is smaller. Though, from an end-user-api
 * ergonomics perspective, you wouldn't typically want to rely on this. As in
 * [ember-data-resources](https://github.com/NullVoxPopuli/ember-data-resources/)
 * the useResource + Resource class are coupled together in to more meaningful APIs --
 * allowing only a single import in most cases.
 *
 * ```ts
 * import { useResource } from 'ember-resources';
 *
 * class MyClass {
 *   data = useResource(this, SomeResource, () => [arg list]);
 * }
 * ```
 *
 * When any tracked data in the args thunk is updated, the Resource will be updated as well
 *
 *  - The `this` is to keep track of destruction -- so when `MyClass` is destroyed, all the resources attached to it can also be destroyed.
 *  - The resource will **do nothing** until it is accessed. Meaning, if you have a template that guards
 *    access to the data, like:
 *    ```hbs
 *    {{#if this.isModalShowing}}
 *       <Modal>{{this.data.someProperty}}</Modal>
 *    {{/if}}
 *    ```
 *    the Resource will not be instantiated until `isModalShowing` is true.
 *
 *  - For more info on Thunks, scroll to the bottom of the README
 */
export function useResource<Instance extends LifecycleResource<any>>(
  context: object,
  klass: Constructable<Instance>,
  thunk?: Thunk
): Instance;

/**
 * For use in the body of a class.
 * Constructs a cached Resource that will reactively respond to tracked data changes
 *
 */
export function useResource<Instance extends Resource<any>>(
  context: object,
  klass: Constructable<Instance>,
  thunk?: Thunk
): Instance;

export function useResource<Instance extends object, Args extends unknown[]>(
  context: object,
  klass: Constructable<Instance>,
  thunk?: Thunk | (() => Args)
): Instance {
  assert(
    `Expected second argument, klass, to be a Resource. ` +
      `This is different from the v1 series where useResource could be used for both functions and class-based Resources. ` +
      `If you intended to pass a function, you'll now (since v2) want to use useFunction instead`,
    isLifecycleResource(klass) || isSimpleResource(klass)
  );

  let target = useUnproxiedResource<Instance>(context, klass, thunk || DEFAULT_THUNK);

  return proxyClass(target);
}

function isLifecycleResource(classOrFn: Constructable | ResourceFn): classOrFn is Constructable {
  return classOrFn.prototype instanceof LifecycleResource;
}

function isSimpleResource(classOrFn: Constructable | ResourceFn): classOrFn is Constructable {
  return classOrFn.prototype instanceof Resource;
}
