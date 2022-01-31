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

import { TrackedFunctionRunner } from './resources/function-runner';
import { proxyClass } from './utils';

import type { ResourceFn } from './resources/function-runner';
import type { Cache } from './types';

type Vanilla<Return> = [object, ResourceFn<Return>];
type WithInitialValue<Return> = [object, NotFunction<Return>, ResourceFn<Return>];

type NotFunction<T> = T extends Function ? never : T;
type UseFunctionArgs<Return> = Vanilla<Return> | WithInitialValue<Return>;

/**
 * For use in the body of a class.
 * Constructs a cached Resource that will reactively respond to tracked data changes
 *
 * @param {Object} destroyable context, e.g.: component instance aka "this"
 * @param {Function} theFunction the function to run with the return value available on .value
 */
export function trackedFunction<Return>(...passed: Vanilla<Return>): { value: Return };

/**
 * For use in the body of a class.
 * Constructs a cached Resource that will reactively respond to tracked data changes
 *
 * @param {Object} destroyable context, e.g.: component instance aka "this"
 * @param {Object} initialValue - a non-function that matches the shape of the eventual return value of theFunction
 * @param {Function} theFunction the function to run with the return value available on .value
 */
export function trackedFunction<Return>(...passed: WithInitialValue<Return>): {
  value: Return;
};

export function trackedFunction<Return>(...passedArgs: UseFunctionArgs<Return>): { value: Return } {
  let [context] = passedArgs;
  let initialValue: Return | undefined;
  let fn: ResourceFn<Return>;

  assert(
    `Expected second argument to trackedFunction to either be an initialValue or the function to run`,
    passedArgs[1] !== undefined
  );

  if (hasNoInitialValue(passedArgs)) {
    fn = passedArgs[1];
  } else {
    initialValue = passedArgs[1];
    fn = passedArgs[2];
  }

  let target = buildUnproxiedFunctionResource<Return>(context, initialValue, fn);

  return proxyClass<any>(target) as { value: Return };
}

function hasNoInitialValue<R>(args: UseFunctionArgs<R>): args is Vanilla<R> {
  return args.length === 2;
}

function buildUnproxiedFunctionResource<Return>(
  context: object,
  initial: Return | undefined,
  fn: ResourceFn<Return, never[]>
): { value: Return } {
  let resource: Cache<Return>;

  return {
    get value(): Return {
      if (!resource) {
        resource = invokeHelper(context, TrackedFunctionRunner, () => {
          return {
            positional: [fn, initial],
          };
        }) as Cache<Return>;
      }

      return getValue<Return>(resource);
    },
  };
}
