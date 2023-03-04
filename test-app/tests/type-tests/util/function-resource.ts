import * as fr from 'ember-resources/util/function-resource';
import { expectType } from 'ts-expect';

import type { resource, use } from 'ember-resources';

expectType<typeof use>(fr.use);
expectType<typeof resource>(fr.resource);
