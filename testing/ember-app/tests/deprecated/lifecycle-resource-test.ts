import { tracked } from '@glimmer/tracking';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { LifecycleResource } from 'ember-resources';

import type { Named, Positional } from 'ember-resources';

module('LifecycleResource', function (hooks) {
  setupTest(hooks);

  test('it can be created like a normal class', async function (assert) {
    class MyResource extends LifecycleResource {
      @tracked count = 0;
    }

    let instance = new MyResource(this.owner, {});

    assert.strictEqual(instance.count, 0);
  });

  test('can define a constructor', function (assert) {
    class MyResource<Args extends Named<{ test: number }>> extends LifecycleResource<Args> {
      constructor(owner: unknown, args: Args) {
        super(owner, args);
      }
    }

    let instance = new MyResource(this.owner, { named: { test: 2 } });

    assert.strictEqual(instance.args.named?.test, 2);
  });

  test('it can be interacted with like a normal class', async function (assert) {
    class Context {
      @tracked num = 0;
    }
    class MyResource extends LifecycleResource<Positional<[Context]>> {
      declare initial: number;

      @tracked count = 1;

      get num() {
        return this.initial * this.count;
      }

      setup() {
        this.initial = this.args.positional[0].num;
      }

      update() {
        this.initial = this.args.positional[0].num;
      }
    }

    let ctx = new Context();
    let instance = new MyResource(this.owner, { positional: [ctx] });

    await settled();

    assert.strictEqual(instance.count, 1);
    assert.strictEqual(instance.initial, undefined, 'invokeHelper not use, initial value not set');

    ctx.num = 3;
    await settled();

    assert.strictEqual(instance.initial, undefined, 'invokeHelper not used, args not reactive');

    instance.update();
    await settled();

    assert.strictEqual(instance.count, 1);
    assert.strictEqual(instance.initial, 3);
    assert.strictEqual(instance.num, 3);

    instance.count = 4;
    await settled();

    assert.strictEqual(
      instance.count,
      4,
      'invokeHelper is not relevant for internally tracked properties'
    );

    assert.strictEqual(instance.count, 4);
    assert.strictEqual(instance.initial, 3);
    assert.strictEqual(instance.num, 12);
  });
});
