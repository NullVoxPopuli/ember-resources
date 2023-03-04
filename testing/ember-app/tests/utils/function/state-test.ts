import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { State } from 'ember-resources/util/function';

module('Utils | trackedFunction | State | js', function (hooks) {
  setupTest(hooks);

  test('initial state', async function (assert) {
    let m = '<invalid state>';
    let resolve: (value?: unknown) => void;

    const promise = new Promise((r) => {
      resolve = r;
    });

    const state = new State(() => promise);
    const promise2 = state.retry();

    m = 'isResolved';
    assert.false(state.isResolved, m);

    m = 'isRejected';
    assert.false(state.isRejected, m);

    m = 'error';
    assert.strictEqual(state.error, null, m);

    m = 'value';
    assert.strictEqual(state.value, null, m);

    m = 'isPending';
    assert.true(state.isPending, m);

    // @ts-ignore This is normal promise usage
    resolve();
    await promise2;
  });

  test('successful state', async function (assert) {
    let m = '<invalid state>';
    let resolve: (value?: unknown) => void;

    const promise = new Promise((r) => {
      resolve = r;
    });

    const value = Symbol('resolved value');

    const state = new State(() => promise);
    const promise2 = state.retry();

    // @ts-ignore This is normal promise usage
    resolve(value);
    await promise2;

    m = 'isResolved';
    assert.true(state.isResolved, m);

    m = 'isRejected';
    assert.false(state.isRejected, m);

    m = 'error';
    assert.strictEqual(state.error, null, m);

    m = 'value';
    assert.strictEqual(state.value, value, m);

    m = 'isPending';
    assert.false(state.isPending, m);
  });

  test('error state', async function (assert) {
    let m = '<invalid state>';
    let reject: (value?: unknown) => void;
    const error = new Error('Denied!');

    const promise = new Promise((_r, r) => {
      reject = r;
    });

    const state = new State(() => promise);
    const promise2 = state.retry();

    // @ts-ignore This is normal promise usage
    reject(error);

    // Avoid a test failure on uncaught promise
    try {
      await promise2;
    } catch (e) {
      if (e !== error) throw e;
    }

    m = 'isResolved';
    assert.false(state.isResolved, m);

    m = 'isRejected';
    assert.true(state.isRejected, m);

    m = 'error';
    assert.strictEqual(state.error, error, m);

    m = 'value';
    assert.strictEqual(state.value, null, m);

    m = 'isPending';
    assert.false(state.isPending, m);
  });
});
