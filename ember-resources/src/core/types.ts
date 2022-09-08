export * from './types/base';
export * from './types/signature-args';
export * from './types/thunk';

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
