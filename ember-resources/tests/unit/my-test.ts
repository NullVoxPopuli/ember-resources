import { module, test } from 'qunit';

module('Test module', function (hooks) {
  test('Test test', function (assert) {
    assert.strictEqual(2, 2, '2 === 2');
    assert.dom('div').doesNotExist();
  });
});
