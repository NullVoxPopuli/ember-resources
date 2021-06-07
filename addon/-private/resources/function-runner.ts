import { isDestroyed, isDestroying } from '@ember/destroyable';
import { waitForPromise } from '@ember/test-waiters';

import { LifecycleResource } from './lifecycle';

import type { ArgsWrapper } from '../types';

export const FUNCTION_TO_RUN = Symbol('FUNCTION TO RUN');

// type UnwrapAsync<T> = T extends Promise<infer U> ? U : T;
// type GetReturn<T extends () => unknown> = UnwrapAsync<ReturnType<T>>;
export type ResourceFn<Return = unknown, Args extends unknown[] = unknown[]> = (
  previous: Return | undefined,
  ...args: Args
) => Return | Promise<Return>;

export interface BaseArgs<FnArgs extends unknown[]> extends ArgsWrapper {
  positional: FnArgs;
}

export class FunctionRunner<
  Return = unknown,
  Args extends unknown[] = unknown[],
  Fn extends ResourceFn<Return, Args> = ResourceFn<Return, Args>
> extends LifecycleResource<BaseArgs<Args>> {
  // Set when using useResource
  declare [FUNCTION_TO_RUN]: Fn;

  declare value: Return | undefined;

  get funArgs() {
    return this.args.positional;
  }

  setup() {
    this.update();
  }

  update() {
    /**
     * NOTE: All positional args are consumed
     */
    let result = this[FUNCTION_TO_RUN](this.value, ...this.funArgs);

    if (typeof result === 'object') {
      if ('then' in result) {
        const recordValue = (value: Return) => {
          if (isDestroying(this) || isDestroyed(this)) {
            return;
          }

          this.value = value;
        };

        waitForPromise(result);

        result.then(recordValue);

        return;
      }
    }

    this.value = result;
  }
}
