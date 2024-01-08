import { assert } from '@ember/debug';
import { deprecate } from '@ember/debug';
// @ts-expect-error
import { setModifierManager } from '@ember/modifier';

import { resourceFactory } from '../index';
import FunctionBasedModifierManager from './manager';

import type { resource } from '../index';
import type { ArgsFor, ElementFor, EmptyObject } from '[core-types]';
import type { ModifierLike } from '@glint/template';

deprecate(
  `importing from 'ember-resources/modifier' is deprecated and will be removed in ember-resources@v7. ` +
    `The exact same code and support is available at https://github.com/universal-ember/reactiveweb. ` +
    `\`pnpm add reactiveweb\` and then \` import { service } from 'reactiveweb/resource/modifier';\`. ` +
    `See also: https://github.com/NullVoxPopuli/ember-resources/issues/1061`,
  false,
  {
    id: `ember-resources.modifier`,
    until: `7.0.0`,
    for: `ember-resources`,
    url: `https://reactive.nullvoxpopuli.com/functions/resource_modifier.modifier.html`,
    since: {
      available: '6.4.4',
      enabled: '6.4.4',
    },
  },
);

// Provide a singleton manager.
const MANAGER = new FunctionBasedModifierManager();

type PositionalArgs<S> = S extends { Args?: object } ? ArgsFor<S['Args']>['Positional'] : [];
type NamedArgs<S> = S extends { Args?: object }
  ? ArgsFor<S['Args']>['Named'] extends object
    ? ArgsFor<S['Args']>['Named']
    : EmptyObject
  : EmptyObject;

type ArgsForFn<S> = S extends { Args?: object }
  ? ArgsFor<S['Args']>['Named'] extends EmptyObject
    ? [...PositionalArgs<S>]
    : [...PositionalArgs<S>, NamedArgs<S>]
  : [];

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
export function modifier<El extends Element, Args extends unknown[] = unknown[]>(
  fn: (element: El, ...args: Args) => void,
): ModifierLike<{
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
export function modifier<S extends { Element?: Element }>(
  fn: (element: ElementFor<S>, ...args: ArgsForFn<S>) => ReturnType<typeof resource>,
): ModifierLike<S>;
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
export function modifier<S extends { Args?: object }>(
  fn: (element: ElementFor<S>, ...args: ArgsForFn<S>) => ReturnType<typeof resource>,
): ModifierLike<S>;
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
export function modifier<S extends { Element?: Element; Args?: object }>(
  fn: (element: ElementFor<S>, ...args: ArgsForFn<S>) => ReturnType<typeof resource>,
): ModifierLike<S>;

export function modifier(fn: (element: Element, ...args: unknown[]) => void): ModifierLike<{
  Element: Element;
  Args: {
    Named: {};
    Positional: [];
  };
}> {
  assert(`modifier() must be invoked with a function`, typeof fn === 'function');
  setModifierManager(() => MANAGER, fn);
  resourceFactory(fn);

  return fn as unknown as ModifierLike<{
    Element: Element;
    Args: {
      Named: {};
      Positional: [];
    };
  }>;
}

/**
 * @internal
 */
export type FunctionBasedModifierDefinition<S> = (
  element: ElementFor<S>,
  positional: PositionalArgs<S>,
  named: NamedArgs<S>,
) => void;
