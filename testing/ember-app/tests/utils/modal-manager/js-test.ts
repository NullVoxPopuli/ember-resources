import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { ModalManager } from 'ember-resources/util/modal-manager';

module('Utils | modal-manager | js', function (hooks) {
  setupTest(hooks);

  test('manages isOpen flag', async function(assert) {
    let subject = new ModalManager();
    assert.false(subject.isOpen, 'isOpen false');
    let resultPromise = subject.open();
    assert.true(subject.isOpen, 'isOpen troue');
    subject.cancel();
    await resultPromise;
    assert.false(subject.isOpen, 'isOpen false');
  });

  test('can be cancelled', async function(assert) {
    let subject = new ModalManager();
    let resultPromise = subject.open();
    subject.cancel();
    let { reason } = await resultPromise;
    assert.equal(reason, 'cancelled');
  });

  test('can be confirmed', async function(assert) {
    let subject = new ModalManager();
    let resultPromise = subject.open();
    subject.confirm('test-value');
    let { reason, value } = await resultPromise;
    assert.equal(reason, 'confirmed');
    assert.equal(value, 'test-value');
  });

  test('can be rejected', async function(assert) {
    let subject = new ModalManager();
    let resultPromise = subject.open();
    subject.reject('test-value');
    let { reason, value } = await resultPromise;
    assert.equal(reason, 'rejected');
    assert.equal(value, 'test-value');
  });

  test('can be errored', async function(assert) {
    let subject = new ModalManager();
    let resultPromise = subject.open();
    subject.error(new Error('test-error'));
    await assert.rejects(resultPromise, /test-error/);
  });

  test('can delegate opening and closing', async function(assert) {
    class TestController {
      open() {
        assert.step('opened');
      }
      close() {
        assert.step('closed');
      }
    }
    let testController = new TestController();
    let subject = new ModalManager();
    subject.delegateTo(testController);
    let resultPromise = subject.open();
    subject.cancel();
    await resultPromise;
    assert.verifySteps(['opened', 'closed']);
  });

  test('provides a factory method for inline delegation', async function(assert) {
    class TestController {
      open() {
        assert.step('opened');
      }
      close() {
        assert.step('closed');
      }
    }
    let calledWith: ModalManager;
    let subject = ModalManager.withDelegate((manager: ModalManager) => {
      calledWith = manager;
      return new TestController();
    });
    let resultPromise = subject.open();
    subject.cancel();
    await resultPromise;
    assert.verifySteps(['opened', 'closed']);
    assert.strictEqual(calledWith, subject);
  });
});
