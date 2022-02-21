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

import { FUNCTION_TO_RUN, FunctionRunner, INITIAL_VALUE } from './resources/function-runner';
import { DEFAULT_THUNK, normalizeThunk, proxyClass } from './utils';

import type { ResourceFn } from './resources/function-runner';
import type { Cache, Constructable, Fn } from './types';

type NonReactiveVanilla<Return, Args extends unknown[]> = [object, ResourceFn<Return, Args>];
type VanillaArgs<Return, Args extends unknown[]> = [object, ResourceFn<Return, Args>, () => Args];
type NonReactiveWithInitialValue<Return, Args extends unknown[]> = [
  object,
  NotFunction<Return>,
  ResourceFn<Return, Args>
];
type WithInitialValueArgs<Return, Args extends unknown[]> = [
  object,
  NotFunction<Return>,
  ResourceFn<Return, Args>,
  () => Args
];

type NotFunction<T> = T extends Function ? never : T;

type UseFunctionArgs<Return, Args extends unknown[]> =
  | NonReactiveVanilla<Return, Args>
  | NonReactiveWithInitialValue<Return, Args>
  | VanillaArgs<Return, Args>
  | WithInitialValueArgs<Return, Args>;

const FUNCTION_CACHE = new WeakMap<Fn, Constructable<any>>();

/**
 *
 * @deprecated use `trackedFunction` instead
 *
 * @description
 * [[useFunction]] provides a way reactively call a function
 * when args to that function change.
 * For use in the body of a class.
 *
 * @example
 * ```ts
 * import { useFunction } from 'ember-resources';
 *
 * class StarWarsInfo {
 *   // access result on info.value
 *   info = useFunction(this, async (state, ...args) => {
 *     if (state) {
 *       let { characters } = state;
 *
 *       return { characters };
 *     }
 *
 *     let [ids] = args;
 *     let response = await fetch(`/characters/${ids}`) ;
 *     let characters = await response.json();
 *
 *     return { characters };
 *   }, () => [this.ids]) // this.ids defined somewhere
 * }
 * ```
 *
 * > `characters` would be accessed via `this.info.value.characters` in the `StarWarsInfo` class
 *
 * While this example is a bit contrived, hopefully it demonstrates how the `state` arg
 * works. During the first invocation, `state` is falsey, allowing the rest of the
 * function to execute. The next time `this.ids` changes, the function will be called
 * again, except `state` will be the `{ characters }` value during the first invocation,
 * and the function will return the initial data.
 *
 * This particular technique could be used to run any async function _safely_ (as long
 * as the function doesn't interact with `this`).
 *
 * In this example, where the function is `async`, the "value" of `info.value` is `undefined` until the
 * function completes.
 *
 * To help prevent accidental async footguns, even if a function is synchronous, it is still ran
 * asynchronously, therefor, the thunk cannot be avoided.
 *
 * ```ts
 * import { useFunction } from 'ember-resources';
 *
 * class MyClass {
 *   @tracked num = 3;
 *
 *   info = useFunction(this, () => {
 *     return this.num * 2;
 *   });
 * }
 * ```
 *
 * `this.info.value` will be  `undefined`, then `6` and will not change when `num` changes.
 *
 *
 * @example
 * These patterns are primarily unexplored so if you run in to any issues,
 * please [open a bug report / issue](https://github.com/NullVoxPopuli/ember-resources/issues/new).
 *
 * Composing class-based resources is expected to "just work", as classes maintain their own state.
 *
 * #### useFunction + useFunction
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { useFunction } from 'ember-resources';
 *
 * class MyComponent extends Component {
 *   rand = useFunction(this, () => {
 *     return useFunction(this, () => Math.random());
 *   });
 * }
 * ```
 * Accessing the result of `Math.random()` would be done via:
 * ```hbs
 * {{this.rand.value.value}}
 * ```
 *
 * Something to note about composing resources is that if arguments passed to the
 * outer resource change, the inner resources are discarded entirely.
 *
 * For example, you'll need to manage the inner resource's cache invalidation yourself if you want
 * the inner resource's behavior to be reactive based on outer arguments:
 *
 * <details><summary>Example data fetching composed functions</summary>
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { useFunction } from 'ember-resources';
 *
 * class MyComponent extends Component {
 *   @tracked id = 1;
 *   @tracked storeName = 'blogs';
 *
 *   records = useFunction(this, (state, storeName) => {
 *       let result: Array<string | undefined> = [];
 *
 *       if (state?.previous?.storeName === storeName) {
 *         return state.previous.innerFunction;
 *       }
 *
 *       let innerFunction = useFunction(this, (prev, id) => {
 *         // pretend we fetched a record using the store service
 *         let newValue = `record:${storeName}-${id}`;
 *
 *         result = [...(prev || []), newValue];
 *
 *         return result;
 *         },
 *         () => [this.id]
 *       );
 *
 *       return new Proxy(innerFunction, {
 *         get(target, key, receiver) {
 *           if (key === 'previous') {
 *             return {
 *               innerFunction,
 *               storeName,
 *             };
 *           }
 *
 *           return Reflect.get(target, key, receiver);
 *         },
 *       });
 *     },
 *     () => [this.storeName]
 *   );
 * }
 * ```
 * ```hbs
 * {{this.records.value.value}} -- an array of "records"
 * ```
 *
 *
 * </details>
 *
 *
 *
 * @param {Object} destroyable context, e.g.: component instance aka "this"
 * @param {Function} theFunction the function to run with the return value available on .value
 */
export function useFunction<Return, Args extends unknown[] = unknown[]>(
  ...passed: NonReactiveVanilla<Return, Args>
): { value: Return };
/**
 *
 * @param {Object} destroyable context, e.g.: component instance aka "this"
 * @param {Function} theFunction the function to run with the return value available on .value
 * @param {Function} thunk to generate / bind tracked data to the function so that the function can re-run when the tracked data updates
 */
export function useFunction<Return, Args extends unknown[] = unknown[]>(
  ...passed: VanillaArgs<Return, Args>
): { value: Return };
/**
 *
 * @param {Object} destroyable context, e.g.: component instance aka "this"
 * @param {Object} initialValue - a non-function that matches the shape of the eventual return value of theFunction
 * @param {Function} theFunction the function to run with the return value available on .value
 * @param {Function} thunk to generate / bind tracked data to the function so that the function can re-run when the tracked data updates
 */
export function useFunction<Return, Args extends unknown[] = unknown[]>(
  ...passed: WithInitialValueArgs<Return, Args>
): { value: Return };
/**
 *
 * @param {Object} destroyable context, e.g.: component instance aka "this"
 * @param {Object} initialValue - a non-function that matches the shape of the eventual return value of theFunction
 * @param {Function} theFunction the function to run with the return value available on .value
 */
export function useFunction<Return, Args extends unknown[] = unknown[]>(
  ...passed: NonReactiveWithInitialValue<Return, Args>
): { value: Return };

/**
 */
export function useFunction<Return, Args extends unknown[] = unknown[]>(
  ...passedArgs: UseFunctionArgs<Return, Args>
): { value: Return } {
  let [context] = passedArgs;
  let initialValue: Return | undefined;
  let fn: ResourceFn<Return, Args>;
  let thunk: (() => Args) | undefined;

  assert(
    `Expected second argument to useFunction to either be an initialValue or the function to run`,
    passedArgs[1] !== undefined
  );

  function isVanillaArgs<R, A extends unknown[]>(
    args: UseFunctionArgs<R, A>
  ): args is VanillaArgs<R, A> | NonReactiveVanilla<R, A> {
    return typeof args[1] === 'function';
  }

  if (isVanillaArgs(passedArgs)) {
    fn = passedArgs[1];
    thunk = passedArgs[2];
  } else {
    initialValue = passedArgs[1];
    fn = passedArgs[2];
    thunk = passedArgs[3];
  }

  let target = buildUnproxiedFunctionResource<Return, Args>(
    context,
    initialValue,
    fn,
    (thunk || DEFAULT_THUNK) as () => Args
  );

  return proxyClass<any>(target) as { value: Return };
}

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
  initial: Return | undefined,
  fn: ResourceFn<Return, ArgsList>,
  thunk: () => ArgsList
): { value: Return } {
  type Klass = Constructable<FunctionRunner<Return, ArgsList>>;

  let resource: Cache<Return>;
  let klass: Klass;
  let existing = FUNCTION_CACHE.get(fn);

  if (existing) {
    klass = existing;
  } else {
    klass = class AnonymousFunctionRunner extends FunctionRunner<Return, ArgsList> {
      [INITIAL_VALUE] = initial;
      [FUNCTION_TO_RUN] = fn;
    } as Klass;

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
