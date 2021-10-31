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
 * Constructs a cached LifecycleResource that will reactively respond to tracked data changes
 *
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
