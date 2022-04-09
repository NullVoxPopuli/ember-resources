// Public API -- base classes
export { LifecycleResource } from './deprecated-in-v4/resources/lifecycle';
export { Resource } from './deprecated-in-v4/resources/simple';

// Public API -- for reducing consumed API surface
export { useTask } from './deprecated-in-v4/ember-concurrency';
export { trackedFunction } from './deprecated-in-v4/tracked-function';
export { use } from './deprecated-in-v4/use';
export { useFunction } from './deprecated-in-v4/use-function';
export { useResource } from './deprecated-in-v4/use-resource';

// To be kept in v5, but without the aliasing
export { helper as useHelper } from './util/helper';

// Public Type Utilities
export type { ArgsWrapper, Named, Positional } from './deprecated-in-v4/types';

// Protected Type Utilities that need to be documented,
// but hopefully shouldn't be used in consuming apps.
// These types may *need* to be exported for folks relying on
// inference
export type { TaskInstance, TaskIsh } from './deprecated-in-v4/resources/ember-concurrency-task';
export type { Thunk } from './deprecated-in-v4/types';
