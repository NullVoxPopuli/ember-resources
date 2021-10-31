import { tracked } from '@glimmer/tracking';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { Resource } from 'ember-resources';

import type { Named, Positional } from 'ember-resources';

module('Resource', function (hooks) {
  setupTest(hooks);

  test('it can be created like a normal class', async function (assert) {
    class MyResource extends Resource {
      @tracked count = 0;
    }

    let instance = new MyResource(this.owner, {});

    assert.equal(instance.count, 0);
  });

  test('can define a constructor', function (assert) {
    class MyResource<Args extends Named<{ test: number }>> extends Resource<Args> {
      constructor(owner: unknown, args: Args, previous?: MyResource<Args>) {
        super(owner, args, previous);
      }
    }

    let instance = new MyResource(this.owner, { named: { test: 2 } });

    assert.equal(instance.args.named?.test, 2);
  });

  test('it can be interacted with like a normal class', async function (assert) {
    class Context {
      @tracked num = 0;
    }
    class MyResource<T extends Positional<[Context]>> extends Resource<T> {
      declare initial: number;

      @tracked count = 1;

      constructor(owner: unknown, args: T, previous?: MyResource<T>) {
        super(owner, args, previous);

        if (!previous) {
          this.initial = this.args.positional[0].num;
        } else {
          this.initial = this.args.positional[0].num * 2;
        }
      }

      get num() {
        return this.initial * this.count;
      }
    }

    let ctx = new Context();
    let instance = new MyResource(this.owner, { positional: [ctx] });

    await settled();

    assert.equal(instance.count, 1);
    assert.equal(
      instance.initial,
      0,
      'invokeHelper not needed, because we manage our own lifecycle in the constructor'
    );

    ctx.num = 3;
    await settled();

    assert.equal(instance.initial, 0, 'invokeHelper not used, args not reactive');

    instance = MyResource.next(instance, { positional: [ctx] });
    await settled();

    assert.equal(instance.count, 1);
    assert.equal(instance.initial, 6);
    assert.equal(instance.num, 6);

    instance.count = 4;
    await settled();

    assert.equal(
      instance.count,
      4,
      'invokeHelper is not relevant for internally tracked properties'
    );

    assert.equal(instance.count, 4);
    assert.equal(instance.initial, 6);
    assert.equal(instance.num, 24);
  });
});
