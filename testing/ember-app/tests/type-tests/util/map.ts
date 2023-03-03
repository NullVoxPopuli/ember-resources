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

const constArray = [1, 2, 3];

export const b = map(globalThis, {
  data: () => constArray,
  map: (element) => {
    expectType<number>(element);

    return element;
  },
});

expectType<number | undefined>(b[0]);
expectType<number | undefined>(b.values()[0]);

const tupleArray = [1, 2, 3] as const;

export const c = map(globalThis, {
  data: () => tupleArray,
  map: (element) => {
    expectType<number>(element);

    return element;
  },
});

expectType<number>(c[0]);
expectType<number>(c.values()[0]);
