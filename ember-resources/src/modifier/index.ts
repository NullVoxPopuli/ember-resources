import { assert } from '@ember/debug';
// @ts-expect-error
import { setModifierManager } from '@ember/modifier';

import { resourceFactory } from '../index';
import FunctionBasedModifierManager from './manager';

import type { ArgsFor, ElementFor } from '[core-types]';
import type { ModifierLike } from '@glint/template';

// Provide a singleton manager.
const MANAGER = new FunctionBasedModifierManager();

type PositionalArgs<S> = S extends { Args?: object } ? ArgsFor<S['Args']>['Positional'] : [];
type NamedArgs<S> = S extends { Args?: object }
  ? ArgsFor<S['Args']>['Named'] extends object
    ? ArgsFor<S['Args']>['Named']
    : never
  : never;

/**
 * An API for writing simple modifiers.
 *
 * @param fn The function which defines the modifier.
 */
export function modifier<S>(
  fn: (element: ElementFor<S>, ...args: [...PositionalArgs<S>, NamedArgs<S>]) => void
): ModifierLike<{
  Element: ElementFor<S>;
  Args: {
    Named: NamedArgs<S>;
    Positional: PositionalArgs<S>;
  };
}> {
  assert(`modifier() must be invoked with a function`, typeof fn === 'function');
  setModifierManager(() => MANAGER, fn);
  resourceFactory(fn);

  return fn as unknown as ModifierLike<{
    Element: ElementFor<S>;
    Args: {
      Named: NamedArgs<S>;
      Positional: PositionalArgs<S>;
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
