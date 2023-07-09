import { expectTypeOf } from 'expect-type';

import { cell, type Reactive, resource, resourceFactory, use } from '../src/index';

const StuckClock = resource(() => 2);

const Clock = resource(({ on }) => {
  let now = cell(Date.now());
  let interval = setInterval(() => (now.current = Date.now()), 1000);

  on.cleanup(() => clearInterval(interval));

  return now;
});

const ParameterizedClock = resourceFactory((locale = 'en-US') => {
  return resource(({ use }) => {
    let now = use(Clock);
    let formatter = new Intl.DateTimeFormat(locale);

    return () => {
      return formatter.format(now.current);
    };
  });
});

class DemoA {
  @use stuck = StuckClock;
  @use clock = Clock;
  @use paramClock = ParameterizedClock();
  @use paramClock2 = ParameterizedClock('en-US');
}

let demoA = new DemoA();

expectTypeOf<typeof demoA.stuck>().toMatchTypeOf<number>();
expectTypeOf<typeof demoA.clock>().toMatchTypeOf<Reactive<number>>();
expectTypeOf<typeof demoA.paramClock>().toMatchTypeOf<string>();
expectTypeOf<typeof demoA.paramClock2>().toMatchTypeOf<string>();

class DemoB {
  @use(StuckClock) declare stuck: number;
  @use(Clock) declare clock: Reactive<number>;
  @use(ParameterizedClock()) declare paramClock: string;
  @use(ParameterizedClock('en-US')) declare paramClock2: string;
}

let demoB = new DemoB();

expectTypeOf<typeof demoB.stuck>().toMatchTypeOf<number>();
expectTypeOf<typeof demoB.clock>().toMatchTypeOf<Reactive<number>>();
expectTypeOf<typeof demoB.paramClock>().toMatchTypeOf<string>();
expectTypeOf<typeof demoB.paramClock2>().toMatchTypeOf<string>();

class DemoC {
  stuck = use(this, StuckClock);
  clock = use(this, Clock);
  paramClock = use(this, ParameterizedClock());
  paramClock2 = use(this, ParameterizedClock('en-US'));
}

let demoC = new DemoC();

expectTypeOf<typeof demoC.stuck>().toMatchTypeOf<Reactive<number>>();
expectTypeOf<typeof demoC.clock>().toMatchTypeOf<Reactive<number>>();
expectTypeOf<typeof demoC.paramClock>().toMatchTypeOf<Reactive<string>>();
expectTypeOf<typeof demoC.paramClock2>().toMatchTypeOf<Reactive<string>>();
