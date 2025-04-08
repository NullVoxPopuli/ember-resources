import { TrackedAsyncData } from 'ember-async-data';
/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but is an example utility to demonstrate a concept when authoring your own resources. However, this utility is still under the broader library's SemVer policy.
 *
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * </div>
 *
 * _An example utility that uses resource_
 *
 * Any tracked data accessed in a tracked function _before_ an `await`
 * will "entangle" with the function -- we can call these accessed tracked
 * properties, the "tracked prelude". If any properties within the tracked
 * payload  change, the function will re-run.
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { tracked } from '@glimmer/tracking';
 * import { resourceFactory, resource, use } from 'ember-resources';
 * import { trackedFunction }  from 'ember-resources/util/function';
 * import { on } from '@ember/modifier';
 *
 * const Request = resourceFactory((idFn) => {
 *   return resource(({use}) => {
 *     let trackedRequest = use(trackedFunction(async () => {
 *       let id = idFn();
 *       let response = await fetch(`https://swapi.dev/api/people/${id}`);
 *       let data = await response.json();
 *
 *       return data; // { name: 'Luke Skywalker', ... }
 *     }));
 *
 *     return trackedRequest;
 *   });
 * });
 *
 * class Demo extends Component {
 *   @tracked id = 1;
 *
 *   updateId = (event) => this.id = event.target.value;
 *
 *   request = use(this, Request(() => this.id));
 *
 *   // Renders "Luke Skywalker"
 *   <template>
 *     {{this.request.current.value.name}}
 *
 *     <input value={{this.id}} {{on 'input' this.updateId}}>
 *   </template>
 * }
 * ```
 */
declare function trackedFunction<Return>(fn: () => Return): State<Return>;
/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but is an example utility to demonstrate a concept when authoring your own resources. However, this utility is still under the broader library's SemVer policy.
 *
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * </div>
 *
 * _An example utility that uses resource_
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
declare function trackedFunction<Return>(context: object, fn: () => Return): State<Return>;
/**
 * State container that represents the asynchrony of a `trackedFunction`
 */
declare class State<Value> {
    #private;
    data: TrackedAsyncData<Value> | null;
    promise: Value;
    constructor(fn: () => Value);
    get state(): TrackedAsyncData<Value>['state'] | 'UNSTARTED';
    /**
     * Initially true, and remains true
     * until the underlying promise resolves or rejects.
     */
    get isPending(): boolean;
    /**
     * Alias for `isResolved || isRejected`
     */
    get isFinished(): boolean;
    /**
     * Alias for `isFinished`
     * which is in turn an alias for `isResolved || isRejected`
     */
    get isSettled(): boolean;
    /**
     * Alias for `isPending`
     */
    get isLoading(): boolean;
    /**
     * When true, the function passed to `trackedFunction` has resolved
     */
    get isResolved(): boolean;
    /**
     * Alias for `isRejected`
     */
    get isError(): boolean;
    /**
     * When true, the function passed to `trackedFunction` has errored
     */
    get isRejected(): boolean;
    /**
     * this.data may not exist yet.
     *
     * Additionally, prior iterations of TrackedAsyncData did
     * not allow the accessing of data before
     * .state === 'RESOLVED'  (isResolved).
     *
     * From a correctness standpoint, this is perfectly reasonable,
     * as it forces folks to handle the states involved with async functions.
     *
     * The original version of `trackedFunction` did not use TrackedAsyncData,
     * and did not have these strictnesses upon property access, leaving folks
     * to be as correct or as fast/prototype-y as they wished.
     *
     * For now, `trackedFunction` will retain that flexibility.
     */
    get value(): Awaited<Value> | null;
    /**
     * When the function passed to `trackedFunction` throws an error,
     * that error will be the value returned by this property
     */
    get error(): {} | null;
    /**
     * Will re-invoke the function passed to `trackedFunction`
     * this will also re-set some properties on the `State` instance.
     * This is the same `State` instance as before, as the `State` instance
     * is tied to the `fn` passed to `trackedFunction`
     *
     * `error` or `resolvedValue` will remain as they were previously
     * until this promise resolves, and then they'll be updated to the new values.
     */
    retry: () => Promise<Value | undefined>;
}
export { trackedFunction, State };
