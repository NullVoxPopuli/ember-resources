import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { waitForPromise } from '@ember/test-waiters';

import { resource } from '../core/function-based';

import type { Hooks } from '../core/function-based';

export type ResourceFn<Return = unknown> = (hooks: Hooks) => Return | Promise<Return>;

type Vanilla<Return> = [object, ResourceFn<Return>];
type WithInitialValue<Return> = [object, NotFunction<Return>, ResourceFn<Return>];

type NotFunction<T> = T extends Function ? never : T;
type UseFunctionArgs<Return> = Vanilla<Return> | WithInitialValue<Return>;

/**
 * _An example utilty that uses [[resource]]_
 *
 * Any tracked data accessed in a tracked function _before_ an `await`
 * will "entangle" with the function -- we can call these accessed tracked
 * properties, the "tracked prelude". If any properties within the tracked
 * payload  change, the function will re-run.
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { tracked } from '@glimmer/tracking';
 * import { trackedFunction }  from 'ember-resources/util/function';
 *
 * class Demo extends Component {
 *   @tracked id = 1;
 *
 *   request = trackedFunction(this, async () => {
 *     let response = await fetch(`https://swapi.dev/api/people/${this.id}`);
 *     let data = await response.json();
 *
 *     return data; // { name: 'Luke Skywalker', ... }
 *   });
 *
 *   updateId = (event) => this.id = event.target.value;
 *
 *   // Renders "Luke Skywalker"
 *   <template>
 *     {{this.request.value.name}}
 *
 *     <input value={{this.id}} {{on 'input' this.updateId}}>
 *   </template>
 * }
 * ```
 * _Note_, this example uses the proposed `<template>` syntax from the [First-Class Component Templates RFC][rfc-799]
 *
 * Also note that after an `await`, the `this` context should not be accessed as it could lead to
 * destruction/timing issues.
 *
 * [rfc-799]: https://github.com/emberjs/rfcs/pull/779
 *
 *
 * @param {Object} destroyable context, e.g.: component instance aka "this"
 * @param {Function} theFunction the function to run with the return value available on .value
 */
export function trackedFunction<Return>(...passed: Vanilla<Return>): State<Return>;

/**
 * _An example utilty that uses [[resource]]_
 *
 * Any tracked data accessed in a tracked function _before_ an `await`
 * will "entangle" with the function -- we can call these accessed tracked
 * properties, the "tracked prelude". If any properties within the tracked
 * payload  change, the function will re-run.
 *
 * The optional initial values can be used to provide a nicer fallback than "null"
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { tracked } from '@glimmer/tracking';
 * import { trackedFunction }  from 'ember-resources/util/function';
 *
 * class Demo extends Component {
 *   @tracked id = 1;
 *
 *   request = trackedFunction(this, { initial value here }, async () => {
 *     let response = await fetch(`https://swapi.dev/api/people/${this.id}`);
 *     let data = await response.json();
 *
 *     return data; // { name: 'Luke Skywalker', ... }
 *   });
 *
 *   updateId = (event) => this.id = event.target.value;
 *
 *   // Renders "Luke Skywalker"
 *   <template>
 *     {{this.request.value.name}}
 *
 *     <input value={{this.id}} {{on 'input' this.updateId}}>
 *   </template>
 * }
 * ```
 * _Note_, this example uses the proposed `<template>` syntax from the [First-Class Component Templates RFC][rfc-799]
 *
 * Also note that after an `await`, the `this` context should not be accessed as it could lead to
 * destruction/timing issues.
 *
 * [rfc-799]: https://github.com/emberjs/rfcs/pull/779
 *
 * @param {Object} destroyable context, e.g.: component instance aka "this"
 * @param {Object} initialValue - a non-function that matches the shape of the eventual return value of theFunction
 * @param {Function} theFunction the function to run with the return value available on .value
 */
export function trackedFunction<Return>(...passed: WithInitialValue<Return>): State<Return>;

export function trackedFunction<Return>(...passedArgs: UseFunctionArgs<Return>) {
  const [context] = passedArgs;
  let initialValue: Return | undefined;
  let state: State<Return>;
  let fn: ResourceFn<Return>;

  assert(
    `Expected second argument to useFunction to either be an initialValue or the function to run`,
    passedArgs[1] !== undefined
  );

  if (hasNoInitialValue(passedArgs)) {
    fn = passedArgs[1];
  } else {
    initialValue = passedArgs[1];
    fn = passedArgs[2];
  }

  return resource<State<Return>>(context, (hooks) => {
    const previousValue = state?.resolvedValue || state?.previousResolvedValue;

    state = new State(fn, hooks, initialValue, previousValue);

    return state;
  });
}

/**
 * State container that represents the asynchrony of a `trackedFunction`
 */
export class State<Value> {
  @tracked isSuccessful = false;
  @tracked isError = false;
  @tracked resolvedValue?: Value;
  @tracked error?: unknown;
  @tracked previousResolvedValue?: Value;

  #fn: ResourceFn<Value>;
  #hooks: Hooks;
  #initialValue: Value | undefined;

  constructor(
    fn: ResourceFn<Value>,
    hooks: Hooks,
    initialValue?: Value,
    previousResolvedValue?: Value
  ) {
    this.#fn = fn;
    this.#hooks = hooks;
    this.#initialValue = initialValue;
    this.previousResolvedValue = previousResolvedValue;
    this.retry();
  }

  get value() {
    return this.resolvedValue || this.#initialValue || null;
  }

  get isPending() {
    return !this.isError && !this.isSuccessful;
  }

  get isLoading() {
    return this.isPending;
  }

  get isFinished() {
    return !this.isPending;
  }

  get previousValue() {
    return this.previousResolvedValue || this.#initialValue || null;
  }

  protected _retry = async () => {
    try {
      // We need to invoke this before going async so that tracked properties are consumed (entangled with) synchronously
      const notQuiteValue = this.#fn(this.#hooks);

      // Start a new JS thread to avoid the "modified twice in a single render" error
      await new Promise((r) => setTimeout(r, 0));

      if (this.resolvedValue !== undefined) {
        this.previousResolvedValue = this.resolvedValue;
      }

      this.isSuccessful = false;
      this.isError = false;
      this.resolvedValue = undefined;
      this.error = undefined;

      const resolvedValue = await Promise.resolve(notQuiteValue);

      this.resolvedValue = resolvedValue;
      this.isSuccessful = true;
    } catch (e) {
      this.error = e;
      this.isError = true;
    }
  };

  /**
   * Will re-invoke the function passed to `trackedFunction`
   * this will also re-set some properties on the `State` instance.
   * This is the same `State` instance as before, as the `State` instance
   * is tied to the `fn` passed to `trackedFunction`
   *
   * `error` or `resolvedValue` will remain as they were previously
   * until this promise resolves, and then they'll be updated to the new values.
   */
  retry = async () => {
    const promise = this._retry();

    await waitForPromise(promise);

    return promise;
  };
}

/**
 * @private
 *
 * type-guard
 */
function hasNoInitialValue<R>(args: UseFunctionArgs<R>): args is Vanilla<R> {
  return args.length === 2;
}
