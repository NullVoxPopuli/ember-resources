/* eslint-disable @typescript-eslint/no-explicit-any */
import { tracked } from '@glimmer/tracking';
import { destroy, isDestroyed, registerDestructor } from '@ember/destroyable';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { dependencySatisfies, importSync, macroCondition } from '@embroider/macros';

import { resource, resourceFactory, use } from 'ember-resources';

import type Owner from '@ember/owner';

let setOwner: (context: unknown, owner: Owner) => void;

if (macroCondition(dependencySatisfies('ember-source', '>=4.12.0'))) {
  // In no version of ember where `@ember/owner` tried to be imported did it exist
  // if (macroCondition(false)) {
  // Using 'any' here because importSync can't lookup types correctly
  setOwner = (importSync('@ember/owner') as any).setOwner;
} else {
  // Using 'any' here because importSync can't lookup types correctly
  setOwner = (importSync('@ember/application') as any).setOwner;
}

// not testing in template, because that's the easy part
module('Core | (function) resource + use | js', function (hooks) {
  setupTest(hooks);

  test('it works', async function (assert) {
    const Doubler = resourceFactory((count: number | (() => number)) => {
      return resource(() => {
        let doubled = typeof count === 'function' ? count() : count;

        return doubled * 2;
      });
    });

    class Test {
      // @tracked count = 0;

      // This syntax *can't* work because the arrow function is static to the class, Test,
      // so then the `this` variable is actually the *test*
      // @use(Doubler(() => this.count)) declare data: number;
      @use(Doubler(() => 2)) declare data: number;
    }

    let foo = new Test();

    setOwner(foo, this.owner);

    assert.strictEqual(foo.data, 4);
  });

  test('it works with the non-decorator syntax', async function (assert) {
    const Doubler = resourceFactory((count: number | (() => number)) => {
      return resource(() => {
        let doubled = typeof count === 'function' ? count() : count;

        return doubled * 2;
      });
    });

    class Test {
      @tracked count = 0;

      data = use(
        this,
        Doubler(() => this.count)
      );
    }

    let foo = new Test();

    setOwner(foo, this.owner);

    assert.strictEqual(foo.data.current, 0);

    foo.count = 3;
    await settled();

    assert.strictEqual(foo.data.current, 6);

    foo.count = 4;
    await settled();

    assert.strictEqual(foo.data.current, 8);
  });

  test('destroyables are correct', async function (assert) {
    const Doubler = resourceFactory(() => {
      return resource(({ on }) => {
        on.cleanup(() => {
          assert.step('destroyed');
        });
      });
    });

    class Test {
      @tracked count = 0;

      data = use(this, Doubler());
    }

    let foo = new Test();

    setOwner(foo, this.owner);

    // destruction only occurs if the resource is constructor, which would be upon access
    foo.data.current;

    assert.notOk(isDestroyed(foo), 'not destroyed');
    assert.verifySteps([]);

    destroy(foo);
    await settled();

    assert.ok(isDestroyed(foo), 'destroyed');
    await settled();
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

      data = use(
        this,
        Doubler(() => this.count)
      );
    }

    let foo = new Test();

    setOwner(foo, this.owner);

    foo.data.current;
    foo.count = 4;
    foo.data.current;
    await settled();
    foo.count = 5;
    foo.data.current;
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

    setOwner(foo, this.owner);

    assert.strictEqual(foo.data1, 'hello');
    assert.strictEqual(foo.data2.current, 'hello');
  });
});
