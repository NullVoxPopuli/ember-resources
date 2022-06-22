import { trackedFunction } from 'ember-resources/util/function';
import { expectType } from 'ts-expect';

import type { State } from 'ember-resources/util/function';

expectType<State<number>>(trackedFunction(globalThis, () => 2));
expectType<State<{ foo: boolean }>>(trackedFunction(globalThis, () => ({ foo: true })));
