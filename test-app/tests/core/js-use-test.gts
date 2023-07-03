/* eslint-disable @typescript-eslint/no-explicit-any */
import { tracked } from '@glimmer/tracking';
import { destroy, isDestroyed, registerDestructor } from '@ember/destroyable';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { resource, resourceFactory, use } from 'ember-resources';

import type Owner from '@ember/owner';

// not testing in template, because that's the easy part
module('Core | Resource | js', function (hooks) {
  setupTest(hooks);

  test('it works', async function (assert) {
    const Doubler = resourceFactory((count: number | (() => number)) => {
      return resource(() => {
        let doubled = typeof count === 'function' ? count() : count;
        return doubled;
      });
    });

    class Test {
      @tracked count = 0;

      @use(Doubler(() => this.count)) declare data: number;
    }

    let foo = new Test();

    assert.strictEqual(foo.data, 0);

    foo.count = 3;
    await settled();

    assert.strictEqual(foo.data, 6);

    foo.count = 4;
    await settled();

    assert.strictEqual(foo.data, 8);
  });

  test('destroyables are correct', async function (assert) {
    const Doubler = resourceFactory((count: number | (() => number)) => {
      return resource(({ on }) => {
        on.cleanup(() => assert.step('destroyed'));
      });
    });

    class Test {
      @tracked count = 0;

      @use(Doubler(() => this.count)) declare data: number;
    }

    let foo = new Test();

    // Intentionally access property that doesn't exist
    (foo.data as any).anything;

    assert.notOk(isDestroyed(foo), 'not destroyed');
    assert.verifySteps([]);

    destroy(foo);
    await settled();

    assert.ok(isDestroyed(foo), 'destroyed');
    assert.verifySteps(['destroyed']);
  });

  test('lifecycle', async function (assert) {
    const Doubler = resourceFactory((count: number | (() => number)) => {
      return resource(({ on }) => {
        on.cleanup(() => assert.step('teardown'));

        return () => {
          assert.step('modify');
          let doubled = typeof count === 'function' ? count() : count;
          return doubled;
        };
      });
    });

    class Test {
      @tracked count = 0;

      @use(Doubler(() => this.count)) declare data: number;
    }

    let foo = new Test();

    foo.data;
    foo.count = 4;
    foo.data;
    await settled();
    foo.count = 5;
    foo.data;
    await settled();

    destroy(foo);
    await settled();

    assert.verifySteps(['modify', 'modify', 'modify', 'teardown']);
  });

  test('does not need args', async function (assert) {
    const Doubler = resource(() => {
      return 'hello';
    });

    class Test {
      @use(Doubler) declare data1: string;

      data2 = use(this, Doubler);
    }

    let foo = new Test();

    assert.strictEqual(foo.data1, 'hello');
    assert.strictEqual(foo.data2, 'hello');
  });
});
