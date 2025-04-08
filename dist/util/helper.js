import { getValue } from '@glimmer/tracking/primitives/cache';
import { deprecate } from '@ember/debug';
import { invokeHelper } from '@ember/helper';
import { normalizeThunk, DEFAULT_THUNK } from '../core/utils.js';

// @ts-ignore
deprecate(`importing from 'ember-resources/util/helper' is deprecated and will be removed in ember-resources@v7. ` + `The exact same code and support is available at https://github.com/universal-ember/reactiveweb. ` + `\`pnpm add reactiveweb\` and then \` import { helper } from 'reactiveweb/helper';\`. ` + `See also: https://github.com/NullVoxPopuli/ember-resources/issues/1061`, false, {
  id: `ember-resources.util.fps`,
  until: `7.0.0`,
  for: `ember-resources`,
  url: `https://reactive.nullvoxpopuli.com/functions/helper.helper.html`,
  since: {
    available: '6.4.4',
    enabled: '6.4.4'
  }
});
/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but is an example utility to demonstrate a concept when authoring your own resources. However, this utility is still under the broader library's SemVer policy.
 *
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * </div>
 *
 * implemented with raw `invokeHelper` API, no classes from `ember-resources` used.
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
function helper(context, helper, thunk = DEFAULT_THUNK) {
  let resource;
  return {
    get value() {
      if (!resource) {
        resource = invokeHelper(context, helper, () => {
          return normalizeThunk(thunk);
        });
      }
      return getValue(resource); // eslint-disable-line
    }
  };
}

export { helper };
//# sourceMappingURL=helper.js.map
