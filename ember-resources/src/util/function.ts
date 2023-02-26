import { tracked } from "@glimmer/tracking";
import { destroy } from "@ember/destroyable";

import { TrackedAsyncData } from "ember-async-data";

import { resource } from "../core/function-based";

import type { Hooks } from "../core/function-based";

export type ResourceFn<Return = unknown> = (
  hooks: Hooks
) => Return | Promise<Return>;

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
 * @param {Object} context destroyable parent, e.g.: component instance aka "this"
 * @param {Function} fn the function to run with the return value available on .value
 */
export function trackedFunction<Return>(
  context: object,
  fn: ResourceFn<Return>
) {
  return resource<State<Return>>(context, (hooks) => {
    const state = new State(fn, hooks);

    hooks.on.cleanup(() => destroy(state));
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

  get state(): "UNSTARTED" | "PENDING" | "RESOLVED" | "REJECTED" {
    return this.data?.state ?? "UNSTARTED";
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

  /**
   * TrackedAsyncData does not allow the accessing of data before
   * .state === 'RESOLVED'  (isResolved).
   *
   * From a correctness standpoint, this is perfectly reasonable,
   * as it forces folks to handle thet states involved with async functions.
   *
   * The original version of `trackedFunction` did not use TrackedAsyncData,
   * and did not have these strictnesses upon property access, leaving folks
   * to be as correct or as fast/prototype-y as they wished.
   *
   * For now, `trackedFunction` will retain that flexibility.
   */
  get value() {
    if (this.data?.isResolved) {
      return this.data.value;
    }

    return null;
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
