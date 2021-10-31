/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { LifecycleResource, Resource, useResource } from 'ember-resources';

import type { Named } from 'ember-resources';

// https://github.com/NullVoxPopuli/ember-resources/issues/108
export function Issue108TypeTest() {
  interface Issue108Args {
    id: number;
  }

  class Issue108<Args extends Named<Issue108Args>> extends Resource<Args> {}
  class Issue108lc<Args extends Named<Issue108Args>> extends LifecycleResource<Args> {}

  // args can also be accessed on a resource if no generic is specified,
  // but the args' values are all "unknown"
  class Issue108p2 extends Resource {}

  const issue108p2a = {} as unknown as Issue108p2;

  console.log({ Issue108, Issue108lc });

  return issue108p2a.args.named?.foo;
}

// https://github.com/NullVoxPopuli/ember-resources/issues/48
export function Issue48TypeTest(): unknown {
  class TestResource extends Resource {}

  return class TestCaseComponent {
    test = useResource(this, TestResource, () => {});
    testArray = useResource(this, TestResource, () => []);
    testVoid = useResource(this, TestResource);
  };
}
