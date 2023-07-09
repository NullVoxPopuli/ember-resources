import { expectTypeOf } from 'expect-type';

import { link } from '../src/link';

class Demo {
  foo = 2;
}

class A {
  @link demo = new Demo();
}

expectTypeOf(new A().demo).toMatchTypeOf<Demo>;

class B {
  @link(Demo) declare demo: Demo;
}

expectTypeOf(new B().demo).toMatchTypeOf<Demo>;

let c = link(new Demo(), new Demo());

expectTypeOf(c).toMatchTypeOf<Demo>;
