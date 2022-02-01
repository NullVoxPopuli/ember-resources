/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Constructable<T = unknown> {
  new (...args: unknown[]): T;
}

export type Fn = (...args: any[]) => any;

/**
 * This shorthand is 3 character shorter than using `positional:` in ArgsWrapper
 *
 * @example
 *
 * ```ts
 * import { Resource } from 'ember-resources';
 *
 * import type { Positional } from 'ember-resources';
 *
 * class MyResource extends Resource<Positional<[number]>> {
 *
 * }
 * ```
 *
 *
 */
export interface Positional<T extends Array<unknown>> {
  positional: T;
}

/**
 * This shorthand is 3 character shorter than using `named:` in ArgsWrapper
 *
 * @example
 *
 * ```ts
 * import { Resource } from 'ember-resources';
 *
 * import type { Named } from 'ember-resources';
 *
 * class MyResource extends Resource<Named<{ bananas: number }>> {
 *
 * }
 * ```
 *
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export interface Named<T extends {} = Record<string, unknown>> {
  named: T;
}

export interface LooseArgs {
  positional?: unknown[];
  // eslint-disable-next-line @typescript-eslint/ban-types
  named?: {};
}

/**
 * This is a utility interface that represents all of the args used throughout
 * Ember.
 *
 * @example
 * ```ts
 * import { Resource } from 'ember-resources';
 *
 * import type { ArgsWrapper } from 'ember-resources';
 *
 * class MyResource extends Resource { // default args type
 *   constructor(owner: unknown, args: ArgsWrapper) {
 *     super(owner, args);
 *   }
 * }
 * ```
 *
 *
 */
export interface ArgsWrapper {
  positional?: unknown[];
  named?: Record<string, unknown>;
}

// typed-ember should provide this from
//   @glimmer/tracking/primitives/cache
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Cache<T = unknown> {
  /* no clue what's in here */
  _: T;
}

// typed-ember should provide this from @ember/helper
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Helper {
  /* no clue what's in here */
}

/**
 * @protected
 *
 * With the exception of the `useResource` + `class` combination, all Thunks are optional.
 * The main caveat is that if your resources will not update without a thunk -- or consuming
 * tracked data within setup / initialization (which is done for you with `useFunction`).
 *
 *
 *  - The thunk is "just a function" that allows tracked data to be lazily consumed by the resource.
 *
 * The args thunk accepts the following data shapes:
 * ```
 * () => [an, array]
 * () => ({ hello: 'there' })
 * () => ({ named: {...}, positional: [...] })
 * ```
 *
 * #### An array
 *
 * when an array is passed, inside the Resource, `this.args.named` will be empty
 * and `this.args.positional` will contain the result of the thunk.
 *
 * _for function resources, this is the only type of thunk allowed._
 *
 * #### An object of named args
 *
 * when an object is passed where the key `named` is not present,
 * `this.args.named` will contain the result of the thunk and `this.args.positional`
 * will be empty.
 *
 * #### An object containing both named args and positional args
 *
 * when an object is passed containing either keys: `named` or `positional`:
 *  - `this.args.named` will be the value of the result of the thunk's `named` property
 *  - `this.args.positional` will be the value of the result of the thunk's `positional` property
 *
 * This is the same shape of args used throughout Ember's Helpers, Modifiers, etc
 *
 */
export type Thunk =
  // No Args
  | (() => [])
  | (() => void)
  // plain array / positional args
  | (() => Required<ArgsWrapper>['positional'])
  // plain named args
  | (() => Required<ArgsWrapper>['named'])
  // both named and positional args... but why would you choose this? :upsidedownface:
  | (() => ArgsWrapper);
