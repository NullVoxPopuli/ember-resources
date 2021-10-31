import { isDestroyed, isDestroying } from '@ember/destroyable';
import { get as consume, notifyPropertyChange as dirty } from '@ember/object';
import { schedule } from '@ember/runloop';
import { waitForPromise } from '@ember/test-waiters';

import { LifecycleResource } from './lifecycle';

import type { ArgsWrapper } from '../types';

export const FUNCTION_TO_RUN = Symbol('FUNCTION TO RUN');
export const INITIAL_VALUE = Symbol('INITIAL VALUE');

const HAS_RUN = Symbol('HAS RUN');

const SECRET_VALUE = '___ Secret Value ___';

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
  protected declare [FUNCTION_TO_RUN]: Fn;
  protected declare [INITIAL_VALUE]: Return | undefined;
  private declare [SECRET_VALUE]: Return | undefined;
  private [HAS_RUN] = false;

  get value(): Return | undefined {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consume(this, SECRET_VALUE as any);

    if (!this[HAS_RUN] && this[INITIAL_VALUE]) {
      return this[INITIAL_VALUE];
    }

    return this[SECRET_VALUE];
  }

  get funArgs() {
    return this.args.positional;
  }

  setup() {
    this.update();
  }

  /**
   * NOTE: there is no reliable way to determine if a function is async before the function is ran.
   *   - we can't use fun[Symbol.toStringtag] === 'AsyncFunction' because minifiers may remove the
   *     async keyword
   */
  update() {
    /**
     * NOTE: All positional args are consumed
     */
    for (let i = 0; i < this.funArgs.length; i++) {
      this.funArgs[i];
    }

    const fun = this[FUNCTION_TO_RUN];

    /**
     * Do not access "value" directly in this function. You'll have infinite re-rendering errors
     */
    const previous = this[SECRET_VALUE];

    const asyncWaiter = async () => {
      // in case the async function tries to consume things on the parent `this`,
      // be sure we start with a fresh frame
      await new Promise((resolve) => schedule('afterRender', resolve));

      if (isDestroying(this) || isDestroyed(this)) {
        return;
      }

      const value = await fun(previous, ...this.funArgs);

      if (isDestroying(this) || isDestroyed(this)) {
        return;
      }

      this[SECRET_VALUE] = value;
      this[HAS_RUN] = true;
      dirty(this, SECRET_VALUE);
    };

    waitForPromise(asyncWaiter());

    // If we ever want to bring sync-support back:
    // this[SECRET_VALUE] = fun(previous, ...this.funArgs) as Return;
  }
}
