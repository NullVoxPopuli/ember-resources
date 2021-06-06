/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import { FUNCTION_TO_RUN, FunctionRunner } from './resources/function-runner';
import { LifecycleResource } from './resources/lifecycle';
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

const FUNCTION_CACHE = new WeakMap<ResourceFn<unknown, unknown[]>, Constructable<FunctionRunner>>();

/**
 * The function is wrapped in a bespoke resource per-function definition
 * because passing a vanilla function to invokeHelper would trigger a
 * different HelperManager, which we want to work a bit differently.
 * See:
 *  - function HelperManager in ember-could-get-used-to-this
 *  - Default Managers RFC
 *
 */
function buildUnproxiedFunctionResource<Return, ArgsList extends unknown[]>(
  context: object,
  fn: ResourceFn<Return, ArgsList>,
  thunk: () => ArgsList
): { value: Return } {
  let resource: Cache<Return>;

  let klass: Constructable<FunctionRunner>;

  let existing = FUNCTION_CACHE.get(fn);

  if (existing) {
    klass = existing;
  } else {
    klass = class AnonymousFunctionRunner extends FunctionRunner<Return, ArgsList> {
      [FUNCTION_TO_RUN] = fn;
    };

    FUNCTION_CACHE.set(fn, klass);
  }

  return {
    get value(): Return {
      if (!resource) {
        resource = invokeHelper(context, klass, () => {
          return normalizeThunk(thunk);
        }) as Cache<Return>;
      }

      return getValue<Return>(resource);
    },
  };
}

/**
 * For use in the body of a class.
 * Constructs a cached Resource that will reactively respond to tracked data changes
 *
 */
export function useResource<Return, Args extends unknown[]>(
  context: object,
  fn: ResourceFn<Return, Args>,
  thunk?: () => Args
): { value: Return };
export function useResource<Instance extends LifecycleResource<any>>(
  context: object,
  klass: Constructable<Instance>,
  thunk?: Thunk
): Instance;

export function useResource<Instance extends object, Args extends unknown[]>(
  context: object,
  klass: Constructable<Instance> | ResourceFn<Instance, Args>,
  thunk?: Thunk | (() => Args)
): Instance {
  let target: { value: Instance };

  if (isLifecycleResource(klass)) {
    target = useUnproxiedResource<Instance>(context, klass, thunk || DEFAULT_THUNK);

    return proxyClass(target);
  }

  target = buildUnproxiedFunctionResource<Instance, Args>(
    context,
    klass,
    (thunk || DEFAULT_THUNK) as () => Args
  );

  return proxyClass(target);
}

function isLifecycleResource(classOrFn: Constructable | ResourceFn): classOrFn is Constructable {
  return classOrFn.prototype instanceof LifecycleResource;
}
