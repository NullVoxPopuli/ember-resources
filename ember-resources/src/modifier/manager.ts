// @ts-expect-error
import { getValue } from '@glimmer/tracking/primitives/cache';
import { destroy } from '@ember/destroyable';
// @ts-expect-error
import { invokeHelper } from '@ember/helper';
// @ts-expect-error
import { capabilities } from '@ember/modifier';

import type { FunctionBasedModifierDefinition } from './index';
import type { ArgsFor, ElementFor } from '[core-types]';

interface State<S> {
  instance: FunctionBasedModifierDefinition<S>;
  helper: unknown;
}

interface CreatedState<S> extends State<S> {
  element: null;
}

interface InstalledState<S> extends State<S> {
  element: ElementFor<S>;
}

// Wraps the unsafe (b/c it mutates, rather than creating new state) code that
// TS does not yet understand.
function installElement<S>(state: CreatedState<S>, element: ElementFor<S>): InstalledState<S> {
  // SAFETY: this cast represents how we are actually handling the state machine
  // transition: from this point forward in the lifecycle of the modifier, it
  // always behaves as `InstalledState<S>`. It is safe because, and *only*
  // because, we immediately initialize `element`. (We cannot create a new state
  // from the old one because the modifier manager API expects mutation of a
  // single state bucket rather than updating it at hook calls.)
  const installedState = state as State<S> as InstalledState<S>;

  installedState.element = element;

  return installedState;
}

function arrangeArgs(element: Element, args: any) {
  const { positional, named } = args;

  let flattenedArgs = [element, ...positional];

  if (Object.keys(named).length > 0) {
    flattenedArgs.push(named);
  }

  return flattenedArgs;
}

export default class FunctionBasedModifierManager<S> {
  capabilities = capabilities('3.22');

  createModifier(instance: FunctionBasedModifierDefinition<S>): CreatedState<S> {
    return { element: null, instance, helper: null };
  }

  installModifier(createdState: CreatedState<S>, element: ElementFor<S>, args: ArgsFor<S>): void {
    const state = installElement(createdState, element);

    this.updateModifier(state, args);
  }

  updateModifier(state: InstalledState<S>, args: ArgsFor<S>): void {
    if (state.helper) {
      destroy(state.helper);
    }

    state.helper = invokeHelper(this, state.instance, () => {
      let foo = arrangeArgs(state.element, args);

      return { positional: foo };
    });

    getValue(state.helper);
  }

  destroyModifier(state: InstalledState<S>): void {
    if (state.helper) {
      destroy(state.helper);
    }
  }
}
