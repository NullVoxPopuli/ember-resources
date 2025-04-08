const INTERMEDIATE_VALUE = '__Intermediate_Value__';
const INTERNAL = '__INTERNAL__';
const CURRENT = Symbol('ember-resources::CURRENT');

// Will need to be a class for .current flattening / auto-rendering

/**
 * This is the type of the arguments passed to the `resource` function
 *
 * ```ts
 * import { resource, type ResourceAPI } from 'ember-resources';
 *
 * export const Clock = resource((api: ResourceAPI) => {
 *   let { on, use, owner } = api;
 *
 *   // ...
 * })
 * ```
 */

/**
 * Type of the callback passed to `resource`
 */

/**
 * The perceived return value of `resource`
 * This is a lie to TypeScript, because the effective value of
 * of the resource is the result of the collapsed functions
 * passed to `resource`
 */

export { CURRENT, INTERMEDIATE_VALUE, INTERNAL };
//# sourceMappingURL=types.js.map
