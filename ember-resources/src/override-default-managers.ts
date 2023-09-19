// @ts-expect-error
import { setHelperManager } from '@ember/helper';
// @ts-expect-error
import { setModifierManager } from '@ember/modifier';

import { ResourceInvokerFactory } from './core/function-based/immediate-invocation';
import { MANAGER } from './modifier/manager';

export function overrideDefaultManagers() {
  setModifierManager(() => MANAGER, Function.prototype);
  setHelperManager(ResourceInvokerFactory, Function.prototype);
}
