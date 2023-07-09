import { expectTypeOf } from 'expect-type';

import type { Class, Constructor } from '[core-types]';

class A {
  a = 1;
}

/**
 * Class + Constructor
 */
expectTypeOf<InstanceType<Class<A>>>().toMatchTypeOf<A>();
expectTypeOf<InstanceType<Constructor<A>>>().toMatchTypeOf<A>();
