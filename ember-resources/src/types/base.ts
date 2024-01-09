/**
 * NOTE:
 *  Empty, EmptyObject, and GetOrElse are copied from @glimmer/component
 */

export type Fn = (...args: any[]) => any;

export type Constructor<Instance> = abstract new (...args: any) => Instance;
export interface Class<Instance> {
  new (...args: unknown[]): Instance;
}

/**
 * @private utility type
 */
export type NoArgs = {
  named: EmptyObject;
  positional: [];
};

/**
 * This is a utility interface that represents the resulting args structure after
 * the thunk is normalized.
 */
export interface ArgsWrapper {
  positional?: unknown[];
  named?: Record<string, any>;
}

// Type-only "symbol" to use with `EmptyObject` below, so that it is *not*
// equivalent to an empty interface.
declare const Empty: unique symbol;

/**
 * This provides us a way to have a "fallback" which represents an empty object,
 * without the downsides of how TS treats `{}`. Specifically: this will
 * correctly leverage "excess property checking" so that, given a component
 * which has no named args, if someone invokes it with any named args, they will
 * get a type error.
 *
 * internal: This is exported so declaration emit works (if it were not emitted,
 *   declarations which fall back to it would not work). It is *not* intended for
 *   public usage, and the specific mechanics it uses may change at any time.
 *   The location of this export *is* part of the public API, because moving it
 *   will break existing declarations, but is not legal for end users to import
 *   themselves, so ***DO NOT RELY ON IT***.
 */
export type EmptyObject = { [Empty]?: true };

export type GetOrElse<Obj, K, Fallback> = K extends keyof Obj ? Obj[K] : Fallback;
