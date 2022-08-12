import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
// import { start } from 'ember-qunit';

setup(QUnit.assert);

QUnit.config.testTimeout = 2000;

// Prevent global Errors from breaking tests
window.onerror = console.error;

// start();

import { module, test } from 'qunit';

module('Test module', function (hooks) {
  test('Test test', function (assert) {
    assert.strictEqual(2, 2, '2 === 2');
    assert.dom('div').doesNotExist();
  });
});
