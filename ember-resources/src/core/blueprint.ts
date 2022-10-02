import { assert } from '@ember/debug';

import type { Resource } from './class-based';
import type { resource } from './function-based';

function isFunctionResource(x: unknown): x is ReturnType<typeof resource> {
  return Boolean(x);
}

function isClassResource(x: unknown): x is typeof Resource {
  return Boolean(x);
}

/**
 * Helper for automatically supporting the various instances
 * of resource invocation.
 * Both with and without this /
 * with and without `@use`
 *
 * Unfortunately, using this means that you may not provide alternate JSDoc Documentation per override.
 */
export function resourceBlueprint<Args extends unknown[] = unknown[], ResourceType = unknown>(
  resourceDefinition: ResourceType
) {
  if (isClassResource(resourceDefinition)) {
    return (...args: Args) => {
      if (args.length === 2) {
        let [destroyable, options] = args;

        /**
         * If any "root level" config changes, we need to throw-away everything.
         * otherwise individual-property reactivity can be managed on a per-property
         * "thunk"-basis
         */
        return resourceDefinition.from(destroyable, () => options);
      }

      let [options] = args;

      return resourceDefinition.from(() => options);
    };
  }

  if (isFunctionResource(resourceDefinition)) {
    // TODO
  }

  assert(`Passed resourceDefinition is not a recognized resource type`);
}
