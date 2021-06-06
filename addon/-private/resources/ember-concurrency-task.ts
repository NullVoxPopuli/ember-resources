import { LifecycleResource } from './lifecycle';

export interface TaskIsh<Return = unknown, Args extends unknown[] = unknown[]> {
  perform: (...args: Args) => TaskInstance<Return>;
  cancelAll: () => void;
}

/**
 * Need to define this ourselves, because between
 * ember-concurrency 1, 2, -ts, decorators, etc
 * there are 5+ ways the task type is defined
 *
 * https://github.com/machty/ember-concurrency/blob/f53656876748973cf6638f14aab8a5c0776f5bba/addon/index.d.ts#L280
 */
export interface TaskInstance<Return> extends Promise<Return> {
  readonly value: Return | null;
  readonly error: unknown;
  readonly isSuccessful: boolean;
  readonly isError: boolean;
  readonly isCanceled: boolean;
  readonly hasStarted: boolean;
  readonly isFinished: boolean;
  readonly isRunning: boolean;
  readonly isDropped: boolean;
  cancel(reason?: string): Promise<void>;
}

export const TASK = Symbol('TASK');

export class TaskResource<
  Return = unknown,
  Args extends unknown[] = unknown[]
> extends LifecycleResource<{
  positional: Args;
}> {
  // Set via useTask
  declare [TASK]: TaskIsh<Return>;
  // Set during setup/update
  declare currentTask: TaskInstance<Return>;
  declare lastTask: TaskInstance<Return> | undefined;

  get taskArgs() {
    return this.args.positional;
  }

  get value() {
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
