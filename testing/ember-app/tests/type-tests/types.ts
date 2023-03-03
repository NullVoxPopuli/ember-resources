/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/ban-types */
import { expectType, type TypeEqual } from 'ts-expect';

import type { ExpandArgs } from 'ember-resources';

expectType<
  TypeEqual<
    ExpandArgs<{
      positional: [number, string];
      named: {
        foo: string;
        bar: number;
      };
    }>,
    {
      Positional: [number, string];
      Named: {
        foo: string;
        bar: number;
      };
    }
  >
>(true);

// Without providing positional, Positional is resulted
expectType<
  ExpandArgs<{
    named: {
      foo: string;
      bar: number;
    };
  }>
>(
  true as unknown as {
    Named: {
      foo: string;
      bar: number;
    };
    Positional: [];
  }
);

expectType<
  ExpandArgs<{
    named: {
      bar: string;
    };
  }>
>(
  // @ts-expect-error
  true as unknown as {
    Named: {
      foo: string;
      bar: number;
    };
    Positional: [];
  }
);

// Invalid types passd to ExpandArgs are ignored
expectType<
  ExpandArgs<{
    positional: {
      foo: string;
      bar: number;
    };
  }>
>(
  true as unknown as {
    Named: {};
    Positional: [];
  }
);

// Without providing named, Named is resulted
expectType<
  ExpandArgs<{
    positional: [string, number];
  }>
>(
  true as unknown as {
    Named: {};
    Positional: [string, number];
  }
);

// Cannot mix lowercase and PascalCase
expectType<
  ExpandArgs<{
    positional: [string, number];
    Named: {
      foo: 'bar';
      hey: number;
    };
  }>
>(
  // @ts-expect-error
  true as unknown as {
    Named: {
      foo: 'bar';
      hey: number;
    };
    positional: [string, number];
  }
);

expectType<ExpandArgs<[string, number]>['Positional']>(true as unknown as [string, number]);
