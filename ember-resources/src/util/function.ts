import { tracked } from '@glimmer/tracking';

import { TrackedAsyncData } from 'ember-async-data';

import { resource } from '../core/function-based';

import type { Hooks } from '../core/function-based';

export type ResourceFn<Return = unknown> = (hooks: Hooks) => Return | Promise<Return>;

export interface TrackedAsyncDataWrapper<T> {
  data: TrackedAsyncData<T>;
  retry: boolean;
}

// function nextLoop(): Promise<void> {
//   return new Promise((resolve) => setTimeout(resolve, 0));
// }

export function isPromise(val: any | Promise<unknown>): val is Promise<unknown> {
  return val && (<Promise<unknown>>val).then !== undefined;
}

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
export function trackedFunction<Return>(context: object, fn: ResourceFn<Return>) {
  return resource<State<Return>>(context, (hooks) => {
    const state = new State(fn, hooks);

    state.retry();

    return state;
  });
}

/**
 * State container that represents the asynchrony of a `trackedFunction`
 */
export class State<Value> {
  @tracked data: TrackedAsyncData<Value> | null = null;
  @tracked promise!: Value | Promise<Value>;

  #fn: ResourceFn<Value>;
  #hooks: Hooks;

  constructor(fn: ResourceFn<Value>, hooks: Hooks) {
    this.#fn = fn;
    this.#hooks = hooks;
  }

  get state(): 'UNSTARTED' | 'PENDING' | 'RESOLVED' | 'REJECTED' {
    return this.data?.state ?? 'UNSTARTED';
  }

  get isPending() {
    return this.data?.isPending ?? false;
  }

  get isResolved() {
    return this.data?.isResolved ?? false;
  }

  get isRejected() {
    return this.data?.isRejected ?? false;
  }

  get value() {
    return this.data ? this.data.value : null;
  }

  get error() {
    return this.data?.error ?? null;
  }

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
    // We need to invoke this before going async so that tracked properties are consumed (entangled with) synchronously
    this.promise = this.#fn(this.#hooks);

    this.data = new TrackedAsyncData(this.promise, this);

    return this.promise;
  };
}
