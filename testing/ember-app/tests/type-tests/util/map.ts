import { map } from 'ember-resources/util/map';
import { expectType } from 'ts-expect';

export const a = map(globalThis, {
  data: () => [1, 2, 3],
  map: (element) => {
    expectType<number>(element);

    return element;
  },
});

expectType<number | undefined>(a[0]);
expectType<number | undefined>(a.values()[0]);
