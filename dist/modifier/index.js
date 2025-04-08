import { deprecate, assert } from '@ember/debug';
import { setModifierManager } from '@ember/modifier';
import '../core/class-based/manager.js';
import '@glimmer/tracking/primitives/cache';
import '@ember/application';
import '@ember/helper';
import { resourceFactory } from '../core/function-based/immediate-invocation.js';
import '../core/function-based/manager.js';
import '@ember/destroyable';
import '../cell-8gZlr81z.js';
import FunctionBasedModifierManager from './manager.js';

deprecate(`importing from 'ember-resources/modifier' is deprecated and will be removed in ember-resources@v7. ` + `The exact same code and support is available at https://github.com/universal-ember/reactiveweb. ` + `\`pnpm add reactiveweb\` and then \` import { service } from 'reactiveweb/resource/modifier';\`. ` + `See also: https://github.com/NullVoxPopuli/ember-resources/issues/1061`, false, {
  id: `ember-resources.modifier`,
  until: `7.0.0`,
  for: `ember-resources`,
  url: `https://reactive.nullvoxpopuli.com/functions/resource_modifier.modifier.html`,
  since: {
    available: '6.4.4',
    enabled: '6.4.4'
  }
});

// Provide a singleton manager.
const MANAGER = new FunctionBasedModifierManager();

/**
 * A resource-based API for building modifiers.
 *
 * You can attach this to an element, and use a `resource` to manage
 * the state, add event listeners, remove event listeners on cleanup, etc.
 *
 * Using resources for modifiers provides a clear and concise API with
 * easy to read concerns.
 *
 *
 * The signature for the modifier here is _different_ from `ember-modifier`, where positional args and named args are grouped together into an array and object respectively.

 * This signature for ember-resource's `modifier` follows the [plain function invocation](https://blog.emberjs.com/plain-old-functions-as-helpers/) signature.
 *
 * ```js
 * import { resource } from 'ember-resources';
 * import { modifier } from 'ember-resources/modifier';
 *
 * const wiggle = modifier((element, arg1, arg2, namedArgs) => {
 *     return resource(({ on }) => {
 *         let animation = element.animate([
 *             { transform: `translateX(${arg1}px)` },
 *             { transform: `translateX(-${arg2}px)` },
 *         ], {
 *             duration: 100,
 *             iterations: Infinity,
 *         });
 *
 *         on.cleanup(() => animation.cancel());
 *     });
 * });
 *
 * <template>
 *     <div {{wiggle 2 5 named="hello"}}>hello</div>
 * </template>
 * ```
 *
 */

/**
 * A resource-based API for building modifiers.
 *
 * You can attach this to an element, and use a `resource` to manage
 * the state, add event listeners, remove event listeners on cleanup, etc.
 *
 * Using resources for modifiers provides a clear and concise API with
 * easy to read concerns.
 *
 *
 * The signature for the modifier here is _different_ from `ember-modifier`, where positional args and named args are grouped together into an array and object respectively.

 * This signature for ember-resource's `modifier` follows the [plain function invocation](https://blog.emberjs.com/plain-old-functions-as-helpers/) signature.
 *
 * ```js
 * import { resource } from 'ember-resources';
 * import { modifier } from 'ember-resources/modifier';
 *
 * const wiggle = modifier((element, arg1, arg2, namedArgs) => {
 *     return resource(({ on }) => {
 *         let animation = element.animate([
 *             { transform: `translateX(${arg1}px)` },
 *             { transform: `translateX(-${arg2}px)` },
 *         ], {
 *             duration: 100,
 *             iterations: Infinity,
 *         });
 *
 *         on.cleanup(() => animation.cancel());
 *     });
 * });
 *
 * <template>
 *     <div {{wiggle 2 5 named="hello"}}>hello</div>
 * </template>
 * ```
 *
 */

/**
 * A resource-based API for building modifiers.
 *
 * You can attach this to an element, and use a `resource` to manage
 * the state, add event listeners, remove event listeners on cleanup, etc.
 *
 * Using resources for modifiers provides a clear and concise API with
 * easy to read concerns.
 *
 *
 * The signature for the modifier here is _different_ from `ember-modifier`, where positional args and named args are grouped together into an array and object respectively.

 * This signature for ember-resource's `modifier` follows the [plain function invocation](https://blog.emberjs.com/plain-old-functions-as-helpers/) signature.
 *
 * ```js
 * import { resource } from 'ember-resources';
 * import { modifier } from 'ember-resources/modifier';
 *
 * const wiggle = modifier((element, arg1, arg2, namedArgs) => {
 *     return resource(({ on }) => {
 *         let animation = element.animate([
 *             { transform: `translateX(${arg1}px)` },
 *             { transform: `translateX(-${arg2}px)` },
 *         ], {
 *             duration: 100,
 *             iterations: Infinity,
 *         });
 *
 *         on.cleanup(() => animation.cancel());
 *     });
 * });
 *
 * <template>
 *     <div {{wiggle 2 5 named="hello"}}>hello</div>
 * </template>
 * ```
 *
 */

/**
 * A resource-based API for building modifiers.
 *
 * You can attach this to an element, and use a `resource` to manage
 * the state, add event listeners, remove event listeners on cleanup, etc.
 *
 * Using resources for modifiers provides a clear and concise API with
 * easy to read concerns.
 *
 *
 * The signature for the modifier here is _different_ from `ember-modifier`, where positional args and named args are grouped together into an array and object respectively.

 * This signature for ember-resource's `modifier` follows the [plain function invocation](https://blog.emberjs.com/plain-old-functions-as-helpers/) signature.
 *
 * ```js
 * import { resource } from 'ember-resources';
 * import { modifier } from 'ember-resources/modifier';
 *
 * const wiggle = modifier((element, arg1, arg2, namedArgs) => {
 *     return resource(({ on }) => {
 *         let animation = element.animate([
 *             { transform: `translateX(${arg1}px)` },
 *             { transform: `translateX(-${arg2}px)` },
 *         ], {
 *             duration: 100,
 *             iterations: Infinity,
 *         });
 *
 *         on.cleanup(() => animation.cancel());
 *     });
 * });
 *
 * <template>
 *     <div {{wiggle 2 5 named="hello"}}>hello</div>
 * </template>
 * ```
 *
 */

function modifier(fn) {
  assert(`modifier() must be invoked with a function`, typeof fn === 'function');
  setModifierManager(() => MANAGER, fn);
  resourceFactory(fn);
  return fn;
}

/**
 * @internal
 */

export { modifier };
//# sourceMappingURL=index.js.map
