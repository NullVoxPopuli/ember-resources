import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { resource } from 'ember-resources';

import { compatOwner } from '../helpers';

module('RAW', function (hooks) {
  setupTest(hooks);

  test('in plain js', async function (assert) {
    let thing = resource(() => 2);
    let parent = {};

    compatOwner.setOwner(parent, this.owner);

    // @ts-expect-error - not sure what to bo about the type discrepency atm
    let instance = thing.create();

    instance.link(parent);
    assert.strictEqual(instance.current, 2);
  });

  test('owner required', async function (assert) {
    let thing = resource(() => 2);

    assert.throws(() => {
      // @ts-expect-error - not sure what to bo about the type discrepency atm
      let instance = thing.create();

      instance.current;
    }, /Cannot create a resource without an owner/);
  });

  test('owner missing', async function (assert) {
    let thing = resource(() => 2);

    assert.throws(() => {
      // @ts-expect-error - not sure what to bo about the type discrepency atm
      let instance = thing.create();

      instance.link({});

      instance.current;
    }, /Cannot link without an owner/);
  });
});
