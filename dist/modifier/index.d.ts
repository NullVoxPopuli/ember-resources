import { resource } from "../index.js";
import { ArgsFor, ElementFor, EmptyObject } from "../core/types.js";
import { ModifierLike } from '@glint/template';
type PositionalArgs<S> = S extends {
    Args?: object;
} ? ArgsFor<S['Args']>['Positional'] : [];
type NamedArgs<S> = S extends {
    Args?: object;
} ? ArgsFor<S['Args']>['Named'] extends object ? ArgsFor<S['Args']>['Named'] : EmptyObject : EmptyObject;
type ArgsForFn<S> = S extends {
    Args?: object;
} ? ArgsFor<S['Args']>['Named'] extends EmptyObject ? [...PositionalArgs<S>] : [...PositionalArgs<S>, NamedArgs<S>] : [];
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
declare function modifier<El extends Element, Args extends unknown[] = unknown[]>(fn: (element: El, ...args: Args) => void): ModifierLike<{
    Element: El;
    Args: {
        Named: EmptyObject;
        Positional: Args;
    };
}>;
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
declare function modifier<S extends {
    Element?: Element;
}>(fn: (element: ElementFor<S>, ...args: ArgsForFn<S>) => ReturnType<typeof resource>): ModifierLike<S>;
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
declare function modifier<S extends {
    Args?: object;
}>(fn: (element: ElementFor<S>, ...args: ArgsForFn<S>) => ReturnType<typeof resource>): ModifierLike<S>;
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
declare function modifier<S extends {
    Element?: Element;
    Args?: object;
}>(fn: (element: ElementFor<S>, ...args: ArgsForFn<S>) => ReturnType<typeof resource>): ModifierLike<S>;
export { modifier };
