import { use, Resource, Thunk } from 'ember-resources';
import { expectType } from 'ts-expect';
// import { expectTypeOf } from 'expect-type'

// Used for making expectType's value be whatever we want
const x: unknown = undefined;

type Instance = InstanceType<new (...args: any) => any>;
type UnknownFn = () => unknown;

class A extends Resource {
  a = 1;
}

expectType<number>(A.from({}).a);
expectType<A>(A.from({}));

type BArgs = {
  positional: [number, string];
  named: {
    num: number;
    str: string;
  };
};

export class B extends Resource<BArgs> {
  modify(positional: BArgs['positional'], named: BArgs['named']) {
    expectType<[number, string]>(positional);
    expectType<number>(named.num);
    expectType<string>(named.str);
  }
}

type CArgs = {
  Positional: [number, string];
  Named: {
    num: number;
    str: string;
  };
};

export class C extends Resource<CArgs> {
  modify(positional: CArgs['Positional'], named: CArgs['Named']) {
    expectType<[number, string]>(positional);
    expectType<number>(named.num);
    expectType<string>(named.str);
  }
}

// C.from(this, () => ...)
expectType<Instance>(x as Parameters<typeof C.from>[0]);
// expectType<Thunk | undefined>(x as Parameters<typeof C.from>[1]);

// @use c = C.from(() => ...)
expectType<Thunk>(x as Parameters<typeof C.from>[0]);
expectType<UnknownFn>(x as Parameters<typeof C.from>[0]);

export class UsageC {
  @use cUse = C.from(() => ({ positional: [1, 'two'], named: { num: 3, str: 'four' }}));
  cThis = C.from(this, () => ({ positional: [1, 'two'], named: { num: 3, str: 'four' }}));
}

expectType<C>(new UsageC().cUse);
expectType<C>(new UsageC().cThis);
