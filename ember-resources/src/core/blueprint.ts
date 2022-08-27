import { resourceFactory } from './function-based';

/**
 * Because resources may be used in a variety of ways,
 * js, templates, with or without `@use`, this function serves
 * as a way to more easily normalize the arguments (and types) for
 * functions that return a resource (or resource factories).
 *
 * @example
 * ```js
 *  export const RemoteData = resourceBlueprint({
 *    setup: (url: string, opts?: FetchOptions => {};
              *    factory: ({ resource }) =>
 *  })
 * ```
 */
export function resourceBlueprint() {
  const factory = () => {};

  resourceFactory(factory);

  return factory;
}
