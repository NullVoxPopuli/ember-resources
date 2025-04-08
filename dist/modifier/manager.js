import { _ as _defineProperty } from '../defineProperty-oklmLEhu.js';
import { getValue } from '@glimmer/tracking/primitives/cache';
import { destroy } from '@ember/destroyable';
import { invokeHelper } from '@ember/helper';
import { capabilities } from '@ember/modifier';

// Wraps the unsafe (b/c it mutates, rather than creating new state) code that
// TS does not yet understand.
function installElement(state, element) {
  // SAFETY: this cast represents how we are actually handling the state machine
  // transition: from this point forward in the lifecycle of the modifier, it
  // always behaves as `InstalledState<S>`. It is safe because, and *only*
  // because, we immediately initialize `element`. (We cannot create a new state
  // from the old one because the modifier manager API expects mutation of a
  // single state bucket rather than updating it at hook calls.)
  const installedState = state;
  installedState.element = element;
  return installedState;
}
function arrangeArgs(element, args) {
  const {
    positional,
    named
  } = args;
  let flattenedArgs = [element, ...positional];
  if (Object.keys(named).length > 0) {
    flattenedArgs.push(named);
  }
  return flattenedArgs;
}
class FunctionBasedModifierManager {
  constructor() {
    _defineProperty(this, "capabilities", capabilities('3.22'));
  }
  createModifier(instance) {
    return {
      element: null,
      instance,
      helper: null
    };
  }
  installModifier(createdState, element, args) {
    const state = installElement(createdState, element);
    this.updateModifier(state, args);
  }
  updateModifier(state, args) {
    if (state.helper) {
      destroy(state.helper);
    }
    state.helper = invokeHelper(this, state.instance, () => {
      let foo = arrangeArgs(state.element, args);
      return {
        positional: foo
      };
    });
    getValue(state.helper);
  }
  destroyModifier(state) {
    if (state.helper) {
      destroy(state.helper);
    }
  }
}

export { FunctionBasedModifierManager as default };
//# sourceMappingURL=manager.js.map
