import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { action } from '@ember/object';
import { waitForPromise } from '@ember/test-waiters';

import { resource } from '../core/function-based';

import type { Hooks } from '../core/function-based';

export type ResourceFn<Return = unknown> = (hooks: Hooks) => Return | Promise<Return>;

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
export function trackedFunction<Return>(...passed: Vanilla<Return>): State<Return>;

/**
 * For use in the body of a class.
 * Constructs a cached Resource that will reactively respond to tracked data changes
 *
 * @param {Object} destroyable context, e.g.: component instance aka "this"
 * @param {Object} initialValue - a non-function that matches the shape of the eventual return value of theFunction
 * @param {Function} theFunction the function to run with the return value available on .value
 */
export function trackedFunction<Return>(...passed: WithInitialValue<Return>): State<Return>;

/**
 * _A wrapper around [[resource]]_
 *
 * Any tracked data accessed in a tracked function _before_ an `await`
 * will "entangle" with the function -- we can call these accessed tracked
 * properties, the "tracked prelude". If any properties within the tracked
 * payload  change, the function will re-run.
 *
 * ```jsx gjs
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
 */
export function trackedFunction<Return>(...passedArgs: UseFunctionArgs<Return>) {
  let [context] = passedArgs;
  let initialValue: Return | undefined;
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

  return resource<TrackedFunctionProperty<Return>>(context, (hooks) => {
    return new TrackedFunctionProperty(fn, hooks, initialValue);
  });
}

export class TrackedFunctionProperty<Value> {
  @tracked state: State<Value>;

  constructor(private fn: ResourceFn<Value>, private hooks: Hooks, initialValue?: Value) {
    this.state = new State(initialValue);
    this.getValue();
  }

  async getValue() {
    try {
      let notQuiteValue = this.fn(this.hooks);
      let promise = Promise.resolve(notQuiteValue);

      waitForPromise(promise);

      let result = await promise;

      this.state.error = undefined;
      this.state.resolvedValue = result;
    } catch (e) {
      this.state.error = e;
    } finally {
      this.state.isResolved = true;
    }
  }

  @action
  execute() {
    this.state = new State(this.state.initialValue);
    this.getValue();

    return this.state;
  }
  get isResolved() {
    return this.state.isResolved;
  }
  get error() {
    return this.state.error;
  }

  get value() {
    return this.state.resolvedValue || this.state.initialValue || null;
  }

  get isPending() {
    return !this.isResolved;
  }

  get isLoading() {
    return this.isPending;
  }

  get isError() {
    return Boolean(this.error);
  }
}

/**
 * State container that represents the asynchrony of a `trackedFunction`
 */
export class State<Value> {
  @tracked isResolved = false;
  @tracked resolvedValue?: Value;
  @tracked error?: unknown;

  constructor(public initialValue?: Value) {}
}

/**
 * @private
 *
 * type-guard
 */
function hasNoInitialValue<R>(args: UseFunctionArgs<R>): args is Vanilla<R> {
  return args.length === 2;
}
