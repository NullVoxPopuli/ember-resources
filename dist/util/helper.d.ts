import { Thunk } from "../core/types.js";
import ClassBasedHelper from '@ember/component/helper';
import { FunctionBasedHelper } from "@ember/component/helper";
import { HelperLike } from '@glint/template';
type Get<T, K, Otherwise = unknown> = K extends keyof T ? T[K] : Otherwise;
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
declare function helper<T = unknown, S = InferSignature<T>, Return = Get<S, 'Return'>>(context: object, helper: T, thunk?: Thunk): {
    value: Return;
};
type InferSignature<T> = T extends HelperLike<infer S> ? S : T extends FunctionBasedHelper<infer S> ? S : T extends ClassBasedHelper<infer S> ? S : 'Signature not found';
export { helper };
