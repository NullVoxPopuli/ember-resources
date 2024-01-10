import { expectTypeOf } from 'expect-type';

import { cell } from '../index.ts';

import type { ContentValue } from '@glint/template';

expectTypeOf(cell('some string')).toMatchTypeOf<ContentValue>();
expectTypeOf(cell(2)).toMatchTypeOf<ContentValue>();
expectTypeOf(cell(false)).toMatchTypeOf<ContentValue>();
expectTypeOf(cell(true)).toMatchTypeOf<ContentValue>();
expectTypeOf(cell(undefined)).toMatchTypeOf<ContentValue>();
expectTypeOf(cell({ toHTML: () => 'hello' })).toMatchTypeOf<ContentValue>();
