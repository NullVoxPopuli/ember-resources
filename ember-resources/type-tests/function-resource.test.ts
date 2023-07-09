import { expectTypeOf } from 'expect-type';

import { cell, type Reactive, resource, resourceFactory } from '../src/index';

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

expectTypeOf<typeof Clock>().toMatchTypeOf<Reactive<number>>();
expectTypeOf<typeof StuckClock>().toMatchTypeOf<number>();
expectTypeOf<ReturnType<typeof ParameterizedClock>>().toMatchTypeOf<string>();
