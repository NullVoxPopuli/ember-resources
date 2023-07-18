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
 * This function runs the first time when the element the modifier was applied
 * to is inserted into the DOM, and it *autotracks* while running. Any values
 * that it accesses will be tracked, including any of its arguments that it
 * accesses, and if any of them changes, the function will run again.
 *
 * **Note:** this will *not* automatically rerun because an argument changes. It
 * will only rerun if it is *using* that argument (the same as with auto-tracked
 * state in general).
 *
 * The modifier can also optionally return a *destructor*. The destructor
 * function will be run just before the next update, and when the element is
 * being removed entirely. It should generally clean up the changes that the
 * modifier made in the first place.
 *
 * @param fn The function which defines the modifier.
 */
// This overload allows users to provide a `Signature` type explicitly at the
// modifier definition site, e.g. `modifier<Sig>((el, pos, named) => {...})`.
// **Note:** this overload must appear second, since TS' inference engine will
// not correctly infer the type of `S` here from the types on the supplied
// callback.
export function modifier<S>(
  fn: (element: ElementFor<S>, ...args: [...PositionalArgs<S>, NamedArgs<S>]) => void
): FunctionBasedModifier<{
  Element: ElementFor<S>;
  Args: {
    Named: NamedArgs<S>;
    Positional: PositionalArgs<S>;
  };
}>;

// This is the runtime signature; it performs no inference whatsover and just
// uses the simplest version of the invocation possible since, for the case of
// setting it on the modifier manager, we don't *need* any of that info, and
// the two previous overloads capture all invocations from a type perspective.
export function modifier<S>(
  fn: (element: ElementFor<S>, ...args: [...PositionalArgs<S>, NamedArgs<S>]) => void
): FunctionBasedModifier<{
  Element: Element;
  Args: {
    Named: object;
    Positional: unknown[];
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
