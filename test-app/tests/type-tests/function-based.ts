import { resource } from 'ember-resources';
import { expectType } from 'ts-expect';

/*
 * These are all lies, but... useful lies.
 *
 * in JS, we require the use of a @use decorator
 *
 * in templates, there is a whole rendering system that figures out the value.
 *
 * In both situations, the effective value *is* the string
 *
 */
expectType<string>(resource(() => 'hi'));
expectType<string>(resource(() => () => 'hi'));
