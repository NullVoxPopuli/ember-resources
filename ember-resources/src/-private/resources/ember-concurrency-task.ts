/* eslint-disable ember/no-get */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { get as consumeTag } from '@ember/object';

import { LifecycleResource } from './lifecycle';

// type AsyncReturnType<T extends (...args: any) => Promise<any>> =
//     T extends (...args: any) => Promise<infer R> ? R : any

export type TaskReturnType<T> = T extends TaskIsh<any, infer Return> ? Return : unknown;
export type TaskArgsType<T> = T extends TaskIsh<infer Args, any> ? Args : unknown[];

export interface TaskIsh<Args extends any[], Return> {
  perform: (...args: Args) => TaskInstance<Return>;
  cancelAll: () => void;
}

/**
 * @private
 *
 * Need to define this ourselves, because between
 * ember-concurrency 1, 2, -ts, decorators, etc
 * there are 5+ ways the task type is defined
 *
 * https://github.com/machty/ember-concurrency/blob/f53656876748973cf6638f14aab8a5c0776f5bba/addon/index.d.ts#L280
 */
export interface TaskInstance<Return = unknown> extends Promise<Return> {
  readonly value: Return | null;
  readonly error: unknown;
  readonly isSuccessful: boolean;
  readonly isError: boolean;
  readonly isCanceled: boolean;
  readonly hasStarted: boolean;
  readonly isFinished: boolean;
  readonly isRunning: boolean;
  readonly isDropped: boolean;
  cancel(reason?: string): void | Promise<void>;
}

// @private
export const TASK = Symbol('TASK');

// @private
export class TaskResource<
  Args extends any[],
  Return,
  LocalTask extends TaskIsh<Args, Return>
> extends LifecycleResource<{
  positional: Args;
}> {
  // Set via useTask
  declare [TASK]: LocalTask;
  // Set during setup/update
  declare currentTask: TaskInstance<Return>;
  declare lastTask: TaskInstance<Return> | undefined;

  get taskArgs() {
    return this.args.positional;
  }

  get value() {
    // in ember-concurrency@v1, value is not consumable tracked data
    // until the task is resolved, so we need to consume the isRunning
    // property so that value updates
    consumeTag(this.currentTask, 'isRunning');

    return this.currentTask.value ?? this.lastTask?.value;
  }

  setup() {
    this.update();
  }

  update() {
    if (this.currentTask) {
      this.lastTask = this.currentTask;
    }

    this.currentTask = this[TASK].perform(...this.taskArgs);
  }

  teardown() {
    this[TASK].cancelAll();
  }
}
