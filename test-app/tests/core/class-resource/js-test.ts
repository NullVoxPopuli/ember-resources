/* eslint-disable @typescript-eslint/no-explicit-any */
import { tracked } from '@glimmer/tracking';
import { destroy, isDestroyed, registerDestructor } from '@ember/destroyable';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { Resource, use } from 'ember-resources';

import type Owner from '@ember/owner';

// not testing in template, because that's the easy part
module('Core | (class) Resource | js', function (hooks) {
  setupTest(hooks);

  test('it works', async function (assert) {
    class Doubler extends Resource<{ positional: [number] }> {
      @tracked num = 0;

      modify([passedNumber]: [number]) {
        this.num = passedNumber * 2;
      }
    }

    class Test {
      @tracked count = 0;

      data = Doubler.from(this, () => [this.count]);
    }

    let foo = new Test();

    assert.strictEqual(foo.data.num, 0);

    foo.count = 3;
    await settled();

    assert.strictEqual(foo.data.num, 6);

    foo.count = 4;
    await settled();

    assert.strictEqual(foo.data.num, 8);
  });

  test('destroyables are correct', async function (assert) {
    class Doubler extends Resource<{ positional: [number] }> {
      constructor(owner: Owner) {
        super(owner);

        registerDestructor(this, () => assert.step('destroyed'));
      }
    }

    class Test {
      @tracked count = 0;

      data = Doubler.from(this, () => [this.count]);
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

  test('can take a typed array https://github.com/NullVoxPopuli/ember-resources/issues/48', async function (assert) {
    class DoubleEverything extends Resource<{ positional: number[] }> {
      @tracked result: number[] = [];

      modify(positional: number[]) {
        this.result = positional.map((num) => num * 2);
      }
    }
    class Test {
      @tracked numbers = [0, 1, 2, 3];

      data = DoubleEverything.from(this, () => [...this.numbers]);
    }

    let foo = new Test();

    await settled();
    assert.deepEqual(foo.data.result, [0, 2, 4, 6]);

    foo.numbers = [2, 6, 2, 7];
    await settled();
    assert.deepEqual(foo.data.result, [4, 12, 4, 14]);
  });

  test('lifecycle', async function (assert) {
    class Doubler extends Resource<{ positional: [number] }> {
      @tracked num = 0;

      constructor(owner: Owner) {
        super(owner);

        registerDestructor(this, () => assert.step('teardown'));
      }

      modify(positional: [number]) {
        assert.step('modify');
        this.num = positional[0] * 2;
      }
    }

    class Test {
      @tracked count = 0;

      data = Doubler.from(this, () => [this.count]);
    }

    let foo = new Test();

    foo.data.num;
    foo.count = 4;
    foo.data.num;
    await settled();
    foo.count = 5;
    foo.data.num;
    await settled();

    destroy(foo);
    await settled();

    assert.verifySteps(['modify', 'modify', 'modify', 'teardown']);
  });

  test('does not need args', async function (assert) {
    class TestResource extends Resource {
      foo = 3;
    }

    class Test {
      dataArray = TestResource.from(this, () => []);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      dataVoid = TestResource.from(this, () => {});
      dataOmitted = TestResource.from(this, () => ({}));
      @use dataWithUse = TestResource.from(() => []);
    }

    let foo = new Test();

    assert.strictEqual(foo.dataArray.foo, 3);
    assert.strictEqual(foo.dataVoid.foo, 3);
    assert.strictEqual(foo.dataOmitted.foo, 3);
    assert.strictEqual(foo.dataWithUse.foo, 3);
  });
});
