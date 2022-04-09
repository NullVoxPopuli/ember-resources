// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import { DEFAULT_THUNK, normalizeThunk } from '../core/utils';

import type { Cache, Thunk } from '../core/types';
// @ts-ignore
import type { helper as emberHelper } from '@ember/component/helper';
import type EmberHelper from '@ember/component/helper';

/**
 * @utility implemented with raw `invokeHelper` API, no classes from `ember-resources` used.
 *
 * -----------------------
 *
 * Enables the use of template-helpers in JavaScript
 *
 * Note that it should be preferred to use regular functions in javascript
 * whenever possible, as the runtime cost of "things as resources" is non-0.
 * For example, if using `@ember/component/helper` utilities, it's a common p
 * practice to split the actual behavior from the framework construct
 * ```js
 * export function plainJs() {}
 *
 * export default helper(() => plainJs())
 * ```
 * so in this case `plainJs` can be used separately.
 *
 * This differentiation makes less of a difference since
 * [plain functions as helpers](https://github.com/emberjs/rfcs/pull/756)
 * will be supported soon.
 *
 * @example
 * ```js
 * import intersect from 'ember-composable-helpers/addon/helpers/intersect';
 *
 * import { helper } from 'ember-resources/util/helper';
 *
 * class Demo {
 *   @tracked listA = [...];
 *   @tracked listB = [...]
 *
 *   intersection = helper(this, intersect, () => [this.listA, this.listB])
 *
 *   toString = (array) => array.join(', ');
 * }
 * ```
 * ```hbs
 * {{this.toString this.intersection.value}}
 * ```
 */
export function helper(
  context: object,
  helper: EmberHelper | ReturnType<typeof emberHelper>,
  thunk: Thunk = DEFAULT_THUNK
): { value: unknown } {
  let resource: Cache<unknown>;

  return {
    get value(): unknown {
      if (!resource) {
        resource = invokeHelper(context, helper, () => {
          return normalizeThunk(thunk);
        }) as Cache<unknown>;
      }

      return getValue<unknown>(resource)!; // eslint-disable-line
    },
  };
}
