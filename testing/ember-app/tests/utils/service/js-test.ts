import { tracked } from '@glimmer/tracking';
import { setOwner } from '@ember/application';
import { destroy, registerDestructor } from '@ember/destroyable';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { service } from 'ember-resources/util/service';
import { resource } from 'ember-resources/util/function-resource';

module('Utils | service | js', function (hooks) {
  setupTest(hooks);

  module('any class', function () {
    test('works', async function (assert) {
      class MyService {
        @tracked data = 0;

        inc = () => this.data++;
      }

      class Test {
        @service(MyService) declare foo: MyService;
      }

      let myTest = new Test();

      setOwner(myTest, this.owner);

      assert.strictEqual(myTest.foo.data, 0);

      myTest.foo.inc();

      assert.strictEqual(myTest.foo.data, 1);
    });

    test('is torn down when the owner is torn down', async function (assert) {
      class MyService {
        foo = 0;
        constructor() {
          assert.step('created');
          registerDestructor(this, () => assert.step('destroying'));
        }
      }

      class Test {
        @service(MyService) declare foo: MyService;
      }

      let owner = {};
      let myTest = new Test();

      // service was not accessed so this does nothing
      setOwner(myTest, owner);
      destroy(owner);

      // property on service is accessed, so it is created
      owner = {};
      myTest = new Test();
      setOwner(myTest, owner);
      myTest.foo.foo;
      destroy(owner);
      await settled();

      assert.verifySteps(['created', 'destroying']);
    });

    test('state is shared between injections (when the owner is the same)', async function (assert) {
      class MyService {
        @tracked data = 0;

        inc = () => this.data++;
      }

      class Test1 {
        @service(MyService) declare foo: MyService;
      }
      class Test2 {
        @service(MyService) declare foo: MyService;
      }

      let myTest1 = new Test1();
      let myTest2 = new Test2();

      setOwner(myTest1, this.owner);
      setOwner(myTest2, this.owner);

      assert.strictEqual(myTest1.foo.data, 0);

      myTest1.foo.inc();

      assert.strictEqual(myTest2.foo.data, 1);
    });

    test('state is NOT shared between injections (when the owner is different)', async function (assert) {
      class MyService {
        @tracked data = 0;

        inc = () => this.data++;
      }

      let owner1 = this.owner;

      class Test1 {
        @service(MyService) declare foo: MyService;
      }

      let owner2 = {};

      class Test2 {
        @service(MyService) declare foo: MyService;
      }

      let myTest1 = new Test1();
      let myTest2 = new Test2();

      setOwner(myTest1, owner1);
      setOwner(myTest2, owner2);

      assert.strictEqual(myTest1.foo.data, 0);

      myTest1.foo.inc();

      assert.strictEqual(myTest1.foo.data, 1);
      assert.strictEqual(myTest2.foo.data, 0);
    });
    test('a test can extend a registered class', async function (assert) {
      assert.expect(0);
    });
  });

  /**
   * While allowing some flexability and quick prototyping,
   * services which are resources, may be harder to test with.
   *
   * Wtih classes, and managers, you can devise an API for swapping
   * out functionality, but if if a resource happens to be a function resource,
   * how would you override that?
   *
   * You'd have to override / re-register the whole thing. And then that ties
   * your tests to implementation, which may be brittle down the line.
   */
  module('resources can be used directly', function () {
    test('it works', async function (assert) {
      let myService = resource(() => {
        return 'yay';
      });

      class Test {
        @service(myService) declare foo: string;
      }

      let myTest = new Test();

      setOwner(myTest, this.owner);

      assert.strictEqual(myTest.foo, 'yay');
    });
    test('is torn down when the owner is torn down', async function (assert) {
      assert.expect(0);
    });
    test('state can be shared between consumers within the same owner', async function (assert) {
      assert.expect(0);
    });
    test('state must not be shared between owners', async function (assert) {
      assert.expect(0);
    });
  });

  module('with a custom manager', function () {
    test('it works', async function (assert) {
      assert.expect(0);
    });
    test('is torn down when the owner is torn down', async function (assert) {
      assert.expect(0);
    });
    test('state can be shared between consumers within the same owner', async function (assert) {
      assert.expect(0);
    });
    test('state must not be shared between owners', async function (assert) {
      assert.expect(0);
    });
    test('a test can extend a registered class', async function (assert) {
      assert.expect(0);
    });
  });
});
