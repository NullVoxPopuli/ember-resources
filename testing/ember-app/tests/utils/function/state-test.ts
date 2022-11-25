import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { State } from 'ember-resources/util/function';

import type { Hooks } from 'ember-resources/core/function-based';

const fakeHooks = {} as Hooks;

module('Utils | State | js', function (hooks) {
  setupTest(hooks);

  test('initial state, no previous value', async function (assert) {
    let m;
    let resolve: (value?: unknown) => void;

    const promise = new Promise((r) => {
      resolve = r;
    });

    const state = new State(() => promise, fakeHooks);

    m = 'isSuccessful';
    assert.false(state.isSuccessful, m);

    m = 'isError';
    assert.false(state.isError, m);

    m = 'resolvedValue';
    assert.strictEqual(state.resolvedValue, undefined, m);

    m = 'error';
    assert.strictEqual(state.error, undefined, m);

    m = 'previousResolvedValue';
    assert.strictEqual(state.previousResolvedValue, undefined, m);

    m = 'value';
    assert.strictEqual(state.value, null, m);

    m = 'isPending';
    assert.true(state.isPending, m);

    m = 'isLoading';
    assert.true(state.isLoading, m);

    m = 'isFinished';
    assert.false(state.isFinished, m);

    m = 'previousValue';
    assert.strictEqual(state.previousValue, null, m);

    // @ts-ignore This is normal promise usage
    resolve();
    await promise;
  });

  test('initial state, with previous value', async function (assert) {
    let m;
    let resolve: (value?: unknown) => void;

    const promise = new Promise((r) => {
      resolve = r;
    });

    const initialValue = Symbol('initial value');
    const state = new State(() => promise, fakeHooks, initialValue);

    m = 'isSuccessful';
    assert.false(state.isSuccessful, m);

    m = 'isError';
    assert.false(state.isError, m);

    m = 'resolvedValue';
    assert.strictEqual(state.resolvedValue, undefined, m);

    m = 'error';
    assert.strictEqual(state.error, undefined, m);

    m = 'previousResolvedValue';
    assert.strictEqual(state.previousResolvedValue, undefined, m);

    m = 'value';
    assert.strictEqual(state.value, initialValue, m);

    m = 'isPending';
    assert.true(state.isPending, m);

    m = 'isLoading';
    assert.true(state.isLoading, m);

    m = 'isFinished';
    assert.false(state.isFinished, m);

    m = 'previousValue';
    assert.strictEqual(state.previousValue, initialValue, m);

    // @ts-ignore This is normal promise usage
    resolve();
    await promise;
  });

  test('successful state, no initial value', async function (assert) {
    let m;
    let resolve: (value?: unknown) => void;

    const promise = new Promise((r) => {
      resolve = r;
    });

    const value = Symbol('resolved value');

    const state = new State(() => promise, fakeHooks);

    // @ts-ignore This is normal promise usage
    resolve(value);
    await settled();

    m = 'isSuccessful';
    assert.true(state.isSuccessful, m);

    m = 'isError';
    assert.false(state.isError, m);

    m = 'resolvedValue';
    assert.strictEqual(state.resolvedValue, value, m);

    m = 'error';
    assert.strictEqual(state.error, undefined, m);

    m = 'previousResolvedValue';
    assert.strictEqual(state.previousResolvedValue, undefined, m);

    m = 'value';
    assert.strictEqual(state.value, value, m);

    m = 'isPending';
    assert.false(state.isPending, m);

    m = 'isLoading';
    assert.false(state.isLoading, m);

    m = 'isFinished';
    assert.true(state.isFinished, m);

    m = 'previousValue';
    assert.strictEqual(state.previousValue, null, m);
  });

  test('successful state, with initial value', async function (assert) {
    let m;
    let resolve: (value?: unknown) => void;

    const promise = new Promise((r) => {
      resolve = r;
    });

    const value = Symbol('resolved value');
    const initialValue = Symbol('initial value');

    const state = new State(() => promise, fakeHooks, initialValue);

    // @ts-ignore This is normal promise usage
    resolve(value);
    await settled();

    m = 'isSuccessful';
    assert.true(state.isSuccessful, m);

    m = 'isError';
    assert.false(state.isError, m);

    m = 'resolvedValue';
    assert.strictEqual(state.resolvedValue, value, m);

    m = 'error';
    assert.strictEqual(state.error, undefined, m);

    m = 'previousResolvedValue';
    assert.strictEqual(state.previousResolvedValue, undefined, m);

    m = 'value';
    assert.strictEqual(state.value, value, m);

    m = 'isPending';
    assert.false(state.isPending, m);

    m = 'isLoading';
    assert.false(state.isLoading, m);

    m = 'isFinished';
    assert.true(state.isFinished, m);

    m = 'previousValue';
    assert.strictEqual(state.previousValue, initialValue, m);
  });

  test('error state', async function (assert) {
    let m;
    let reject: (value?: unknown) => void;
    const initialValue = Symbol('initial value');
    const error = Symbol('reject value');

    const promise = new Promise((_r, r) => {
      reject = r;
    });

    const state = new State(() => promise, fakeHooks, initialValue);

    // @ts-ignore This is normal promise usage
    reject(error);

    // Avoid a test failure on uncaught promise
    try {
      await promise;
    } catch(e) {
      if (e !== error) throw e;
    }

    await settled();

    m = 'isSuccessful';
    assert.false(state.isSuccessful, m);

    m = 'isError';
    assert.true(state.isError, m);

    m = 'resolvedValue';
    assert.strictEqual(state.resolvedValue, undefined, m);

    m = 'error';
    assert.strictEqual(state.error, error, m);

    m = 'previousResolvedValue';
    assert.strictEqual(state.previousResolvedValue, undefined, m);

    m = 'value';
    assert.strictEqual(state.value, initialValue, m);

    m = 'isPending';
    assert.false(state.isPending, m);

    m = 'isLoading';
    assert.false(state.isLoading, m);

    m = 'isFinished';
    assert.true(state.isFinished, m);

    m = 'previousValue';
    assert.strictEqual(state.previousValue, initialValue, m);
  });

  test('previousValue should be available when passing, retrying, passing', async function (assert) {
    let m;
    let resolve: (value?: unknown) => void;
    const value1 = Symbol('resolved value 1');
    const value2 = Symbol('resolved value 2');
    const initialValue = Symbol('initial value');

    let promise = new Promise((r) => {
      resolve = r;
    });
;

    const state = new State(() => promise, fakeHooks, initialValue);

    // @ts-ignore This is normal promise usage
    resolve(value1);
    promise = new Promise((r) => {
      resolve = r;
    });
;
    state.retry();

    // @ts-ignore This is normal promise usage
    resolve(value2);
    await settled();

    m = 'isSuccessful';
    assert.true(state.isSuccessful, m);

    m = 'isError';
    assert.false(state.isError, m);

    m = 'resolvedValue';
    assert.strictEqual(state.resolvedValue, value2, m);

    m = 'error';
    assert.strictEqual(state.error, undefined, m);

    m = 'previousResolvedValue';
    assert.strictEqual(state.previousResolvedValue, value1, m);

    m = 'value';
    assert.strictEqual(state.value, value2, m);

    m = 'isPending';
    assert.false(state.isPending, m);

    m = 'isLoading';
    assert.false(state.isLoading, m);

    m = 'isFinished';
    assert.true(state.isFinished, m);

    m = 'previousValue';
    assert.strictEqual(state.previousValue, value1, m);
  });

  test('previousValue should be available when passing, retrying, failing', async function (assert) {
    let m;
    let resolveOrReject: (value?: unknown) => void;
    const value1 = Symbol('resolved value 1');
    const value2 = Symbol('rejected value 2');
    const initialValue = Symbol('initial value');

    let promise = new Promise((r) => {
      resolveOrReject = r;
    });

    const state = new State(() => promise, fakeHooks, initialValue);

    // @ts-ignore This is normal promise usage
    resolveOrReject(value1);
    promise = new Promise((_, r) => {
      resolveOrReject = r;
    });
    state.retry();

    // @ts-ignore This is normal promise usage
    resolveOrReject(value2);

    // Avoid a test failure on uncaught promise
    try {
      await promise;
    } catch(e) {
      if (e !== value2) throw e;
    }

    await settled();

    m = 'isSuccessful';
    assert.false(state.isSuccessful, m);

    m = 'isError';
    assert.true(state.isError, m);

    m = 'resolvedValue';
    assert.strictEqual(state.resolvedValue, undefined, m);

    m = 'error';
    assert.strictEqual(state.error, value2, m);

    m = 'previousResolvedValue';
    assert.strictEqual(state.previousResolvedValue, value1, m);

    m = 'value';
    assert.strictEqual(state.value, initialValue, m);

    m = 'isPending';
    assert.false(state.isPending, m);

    m = 'isLoading';
    assert.false(state.isLoading, m);

    m = 'isFinished';
    assert.true(state.isFinished, m);

    m = 'previousValue';
    assert.strictEqual(state.previousValue, value1, m);
  });

  test('previousValue should be available when passing, retrying, failing, retrying, passing', async function (assert) {
    let m;
    let resolveOrReject: (value?: unknown) => void;
    const value1 = Symbol('resolved value 1');
    const value2 = Symbol('rejected value 2');
    const value3 = Symbol('resolved value 3');
    const initialValue = Symbol('initial value');

    let promise = new Promise((r) => {
      resolveOrReject = r;
    });

    const state = new State(() => promise, fakeHooks, initialValue);

    // @ts-ignore This is normal promise usage
    resolveOrReject(value1);
    promise = new Promise((_, r) => {
      resolveOrReject = r;
    });
    state.retry();

    // @ts-ignore This is normal promise usage
    resolveOrReject(value2);

    // Avoid a test failure on uncaught promise
    try {
      await promise;
    } catch(e) {
      if (e !== value2) throw e;
    }

    await settled();

    promise = new Promise((r) => {
      resolveOrReject = r;
    });
    state.retry();

    // @ts-ignore This is normal promise usage
    resolveOrReject(value3)
    await settled();

    m = 'isSuccessful';
    assert.true(state.isSuccessful, m);

    m = 'isError';
    assert.false(state.isError, m);

    m = 'resolvedValue';
    assert.strictEqual(state.resolvedValue, value3, m);

    m = 'error';
    assert.strictEqual(state.error, undefined, m);

    m = 'previousResolvedValue';
    assert.strictEqual(state.previousResolvedValue, value1, m);

    m = 'value';
    assert.strictEqual(state.value, value3, m);

    m = 'isPending';
    assert.false(state.isPending, m);

    m = 'isLoading';
    assert.false(state.isLoading, m);

    m = 'isFinished';
    assert.true(state.isFinished, m);

    m = 'previousValue';
    assert.strictEqual(state.previousValue, value1, m);
  });
});
