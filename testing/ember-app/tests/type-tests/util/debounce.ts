import { debounce } from 'ember-resources/util/debounce';
import { expectType } from 'ts-expect';

expectType<string | undefined>(debounce(200, () => 'boop'));
expectType<number | undefined>(debounce(200, () => 2));
