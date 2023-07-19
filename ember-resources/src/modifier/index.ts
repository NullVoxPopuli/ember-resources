import { assert } from '@ember/debug';
// @ts-expect-error
import { setModifierManager } from '@ember/modifier';

import { resourceFactory } from '../index';
import FunctionBasedModifierManager from './manager';

import type { ArgsFor, ElementFor, EmptyObject, Named, Positional } from '[core-types]';

// Provide a singleton manager.
const MANAGER = new FunctionBasedModifierManager();

type PositionalArgs<S> = S extends { Args?: object } ? ArgsFor<S['Args']>['Positional'] : [];
type NamedArgs<S> = S extends { Args?: object } ? ArgsFor<S['Args']>['Named'] : EmptyObject;

type FunctionBasedModifier<S> = {};

/**
 * An API for writing simple modifiers.
 *
 * @param fn The function which defines the modifier.
 */
export function modifier<S>(
  fn: (element: ElementFor<S>, ...args: [...PositionalArgs<S>, NamedArgs<S>]) => void
): FunctionBasedModifier<{
  Element: Element;
  Args: {
    Named: NamedArgs<S>;
    Positional: PositionalArgs<S>;
  };
}> {
  assert(`modifier() must be invoked with a function`, typeof fn === 'function');
  setModifierManager(() => MANAGER, fn);
  resourceFactory(fn);

  return fn;
}

/**
 * @internal
 */
export type FunctionBasedModifierDefinition<S> = (
  element: ElementFor<S>,
  positional: PositionalArgs<S>,
  named: NamedArgs<S>
) => void;
