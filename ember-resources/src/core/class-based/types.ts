/**
 * All of this is baseds off the types for @glimmer/component
 * (post starting official typescript support in ember)
 */

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
 * @internal This is exported so declaration emit works (if it were not emitted,
 *   declarations which fall back to it would not work). It is *not* intended for
 *   public usage, and the specific mechanics it uses may change at any time.
 *   The location of this export *is* part of the public API, because moving it
 *   will break existing declarations, but is not legal for end users to import
 *   themselves, so ***DO NOT RELY ON IT***.
 */
export type EmptyObject = { [Empty]?: true };

type GetOrElse<Obj, K, Fallback> = K extends keyof Obj ? Obj[K] : Fallback;

type ArgsFor<S> =
  // Signature['Args']
  S extends { Named?: object; Positional?: unknown[] }
    ? {
        Named: GetOrElse<S, 'Named', EmptyObject>;
        Positional: GetOrElse<S, 'Positional', []>;
      }
    : S extends { named?: object; positional?: unknown[] }
    ? {
        Named: GetOrElse<S, 'named', EmptyObject>;
        Positional: GetOrElse<S, 'positional', []>;
      }
    : { Named: EmptyObject; Positional: [] };

/**
 * Converts a variety of types to the expanded arguments type
 * that aligns with the 'Args' portion of the 'Signature' types
 * from ember's helpers, modifiers, components, etc
 */
export type ExpandArgs<T> = T extends any[]
  ? ArgsFor<{ Positional: T }>
  : T extends any
  ? ArgsFor<T>
  : never;

export type Positional<T> = ExpandArgs<T>['Positional'];
export type Named<T> = ExpandArgs<T>['Named'];
