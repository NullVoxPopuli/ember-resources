// typed-ember should provide this from
//   @glimmer/tracking/primitives/cache
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Cache<T = unknown> {
  /* no clue what's in here */
  _: T;
}

export interface Stage1DecoratorDescriptor {
  initializer: () => unknown;
}

export type Stage1Decorator = (
  prototype: object,
  key: string | symbol,
  descriptor?: Stage1DecoratorDescriptor,
) => any;
