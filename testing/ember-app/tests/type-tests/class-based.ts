import { Resource } from 'ember-resources';
import { expectType } from 'ts-expect';

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
