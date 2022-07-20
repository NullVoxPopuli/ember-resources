import { map } from 'ember-resources/util/map';
import { expectType } from 'ts-expect';

export const a = map(globalThis, {
  data: () => [1, 2, 3],
  map: (element, index) => {
    expectType<number>(element);
    expectType<number>(index);

    return element;
  },
});

expectType<number>(a[0]);
expectType<number>(a.values()[0]);
