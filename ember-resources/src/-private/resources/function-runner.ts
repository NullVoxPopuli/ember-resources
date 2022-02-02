import { isDestroyed, isDestroying } from '@ember/destroyable';
import { get as consume, notifyPropertyChange as dirty } from '@ember/object';
import { schedule } from '@ember/runloop';
import { waitForPromise } from '@ember/test-waiters';

import { LifecycleResource } from './lifecycle';

import type { ArgsWrapper } from '../types';

export const FUNCTION_TO_RUN = Symbol('FUNCTION TO RUN');
export const INITIAL_VALUE = Symbol('INITIAL VALUE');

const HAS_RUN = Symbol('HAS RUN');
const RUNNER = Symbol('RUNNER');

export const SECRET_VALUE = '___ Secret Value ___';

// type UnwrapAsync<T> = T extends Promise<infer U> ? U : T;
// type GetReturn<T extends () => unknown> = UnwrapAsync<ReturnType<T>>;
export type ResourceFn<Return = unknown, Args extends unknown[] = unknown[]> = (
  previous: Return | undefined,
  ...args: Args
) => Return | Promise<Return>;

export interface BaseArgs<FnArgs extends unknown[]> extends ArgsWrapper {
  positional: FnArgs;
}

export class TrackedFunctionRunner<
  Return = unknown,
  Fn extends ResourceFn<Return, never[]> = ResourceFn<Return, never[]>
> extends LifecycleResource<BaseArgs<never[]>> {
  protected declare [FUNCTION_TO_RUN]: Fn;
  protected declare [SECRET_VALUE]: Return | undefined;

  get value(): Return | undefined {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return consume(this, SECRET_VALUE as any);
  }

  setup() {
    waitForPromise(this[RUNNER]());
  }

  update() {
    waitForPromise(this[RUNNER]());
  }

  private async [RUNNER]() {
    const { [FUNCTION_TO_RUN]: fn } = this;

    if (fn === undefined) {
      return;
    }

    let previousValue = this[SECRET_VALUE];
    let value = fn(previousValue, ...[]);

    // disconnect from the tracking frame, no matter the type of function
    await Promise.resolve();

    if (isDestroying(this) || isDestroyed(this)) {
      return;
    }

    if (typeof value === 'object' && 'then' in value) {
      // value is actually a promise, so we don't want to return
      // an unresolved promise.
      value = await value;

      if (isDestroying(this) || isDestroyed(this)) {
        return;
      }
    }

    this[SECRET_VALUE] = value;
    dirty(this, SECRET_VALUE);
  }
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
      await new Promise((resolve) => schedule('afterRender', resolve, null));

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
