import { assert } from '@ember/debug';
// @ts-expect-error
import { setModifierManager } from '@ember/modifier';

import { resourceFactory } from '../index';
import FunctionBasedModifierManager from './manager';

import type { resource } from '../index';
import type { ArgsFor, ElementFor, EmptyObject } from '[core-types]';
import type { ModifierLike } from '@glint/template';

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

export function modifier<El extends Element, Args extends unknown[] = unknown[]>(
  fn: (element: El, ...args: Args) => void
): ModifierLike<{
  Element: El;
  Args: {
    Named: EmptyObject;
    Positional: Args;
  };
}>;

export function modifier<S extends { Element?: Element }>(
  fn: (element: ElementFor<S>, ...args: ArgsForFn<S>) => ReturnType<typeof resource>
): ModifierLike<S>;
export function modifier<S extends { Args?: object }>(
  fn: (element: ElementFor<S>, ...args: ArgsForFn<S>) => ReturnType<typeof resource>
): ModifierLike<S>;
export function modifier<S extends { Element?: Element; Args?: object }>(
  fn: (element: ElementFor<S>, ...args: ArgsForFn<S>) => ReturnType<typeof resource>
): ModifierLike<S>;

/**
 * An API for writing simple modifiers.
 *
 * @param fn The function which defines the modifier.
 */
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
  named: NamedArgs<S>
) => void;
