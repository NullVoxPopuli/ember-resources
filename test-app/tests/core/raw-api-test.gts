// @ts-ignore - I don't want to deal with DT/native type compatibility here
import { cached, tracked } from '@glimmer/tracking';
import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { resource } from 'ember-resources';

import { compatOwner } from '../helpers';

module('RAW', function (hooks) {
  setupTest(hooks);

  test('in plain js', async function (assert) {
    let thing = resource(() => 2);
    let parent = {};

    compatOwner.setOwner(parent, this.owner);

    // @ts-expect-error - types are a lie due to decorators
    let instance = thing.create();

    instance.link(parent);
    assert.strictEqual(instance.current, 2);
  });

  test('owner required', async function (assert) {
    let thing = resource(() => 2);

    assert.throws(() => {
      // @ts-expect-error - types are a lie due to decorators
      let instance = thing.create();

      instance.current;
    }, /Cannot create a resource without an owner/);
  });

  test('owner missing', async function (assert) {
    let thing = resource(() => 2);

    assert.throws(() => {
      // @ts-expect-error - types are a lie due to decorators
      let instance = thing.create();

      instance.link({});

      instance.current;
    }, /Cannot link without an owner/);
  });
});

module('RAW Rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('is reactive', async function (assert) {
    class Context {
      @tracked count = 0;

      _thing = resource(() => this.count);

      @cached
      get thing() {
        // @ts-expect-error - types are a lie due to decorators
        let instance = this._thing.create();

        instance.link(this);

        return instance;
      }
    }

    let ctx = new Context();

    compatOwner.setOwner(ctx, this.owner);

    await render(<template>{{ctx.thing.current}}</template>);

    assert.dom().hasText('0');

    ctx.count++;
    await settled();

    assert.dom().hasText('1');
  });

  test('completely within a getter', async function (assert) {
        class Context {
      @tracked count = 0;


      @cached
      get thing() {
        assert.step('get:thing');

        let _thing = resource(() => {
          assert.step('resource:construct');

          return this.count;
        });

        // @ts-expect-error - types are a lie due to decorators
        let instance = _thing.create();

        instance.link(this);

        return instance;
      }
    }

    let ctx = new Context();

    compatOwner.setOwner(ctx, this.owner);

    await render(<template>{{ctx.thing.current}}</template>);

    assert.dom().hasText('0');
    assert.verifySteps(['get:thing', 'resource:construct']);

    ctx.count++;
    await settled();

    assert.dom().hasText('1');
    assert.verifySteps(['resource:construct']);
  });
});
