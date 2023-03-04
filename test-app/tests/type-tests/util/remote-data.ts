import { resource } from 'ember-resources';
import { RemoteData, remoteData } from 'ember-resources/util/remote-data';
import { expectType } from 'ts-expect';

import type { State } from 'ember-resources/util/remote-data';

expectType<ReturnType<typeof remoteData>>(resource((hooks) => remoteData(hooks, 'http://...')));

expectType<State<number>>(RemoteData<number>('http://...'));
expectType<State<number>>(RemoteData<number>(() => 'http://...'));
expectType<State<number>>(RemoteData<number>('http://...', {}));
