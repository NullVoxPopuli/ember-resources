/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import { TASK, TaskResource } from './resources/ember-concurrency-task';
import { DEFAULT_THUNK, normalizeThunk } from './utils';

import type { TaskInstance, TaskIsh } from './resources/ember-concurrency-task';
import type { Cache, Constructable } from './types';

export function useTask<Return = unknown, Args extends unknown[] = unknown[]>(
  context: object,
  task: TaskIsh<Return, Args>,
  thunk?: () => Args
) {
  assert(`Task does not have a perform method. Is it actually a task?`, 'perform' in task);

  let target = buildUnproxiedTaskResource(context, task, (thunk || DEFAULT_THUNK) as () => Args);

  // TS can't figure out what the proxy is doing
  return proxyClass<TaskResource<Return, Args>>(target) as never as TaskInstance<Return>;
}

const TASK_CACHE = new WeakMap<TaskIsh, Constructable<TaskResource>>();

function buildUnproxiedTaskResource<Return, ArgsList extends unknown[] = unknown[]>(
  context: object,
  task: TaskIsh<Return, ArgsList>,
  thunk: () => ArgsList
) {
  let resource: Cache<Return>;
  let klass: Constructable<TaskResource>;
  let existing = TASK_CACHE.get(task);

  if (existing) {
    klass = existing;
  } else {
    klass = class AnonymousTaskRunner extends TaskResource<Return, ArgsList> {
      [TASK] = task;
    };

    TASK_CACHE.set(task, klass);
  }

  return {
    get value(): TaskResource<Return, ArgsList> {
      if (!resource) {
        resource = invokeHelper(context, klass, () => {
          return normalizeThunk(thunk);
        }) as Cache<Return>;
      }

      return getValue(resource);
    },
  };
}

export function proxyClass<Instance extends TaskResource>(target: { value: Instance }) {
  return new Proxy(target, {
    get(target, key): unknown {
      const taskRunner = target.value;

      if (key === 'value') {
        /**
         * getter than fallsback to the previous task's value
         */
        return taskRunner.value;
      }

      const instance = taskRunner.currentTask;

      const value = Reflect.get(instance as object, key, instance);

      return typeof value === 'function' ? value.bind(instance) : value;
    },
    ownKeys(target): (string | symbol)[] {
      return Reflect.ownKeys(target.value);
    },
    getOwnPropertyDescriptor(target, key): PropertyDescriptor | undefined {
      return Reflect.getOwnPropertyDescriptor(target.value, key);
    },
  }) as never as Instance;
}
