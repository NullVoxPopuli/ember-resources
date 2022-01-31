/* eslint-disable @typescript-eslint/no-explicit-any */
export type Fn = (...args: any[]) => any;

export type ResourceFn<Return = unknown, Args extends unknown[] = unknown[]> = (
  previous: Return | undefined,
  ...args: Args
) => Return | Promise<Return>;

export interface Constructable<T = unknown> {
  new (...args: unknown[]): T;
}

export interface Positional<T extends Array<unknown>> {
  positional: T;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export interface Named<T extends {} = Record<string, unknown>> {
  named: T;
}

export interface LooseArgs {
  positional?: unknown[];
  // eslint-disable-next-line @typescript-eslint/ban-types
  named?: {};
}

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
