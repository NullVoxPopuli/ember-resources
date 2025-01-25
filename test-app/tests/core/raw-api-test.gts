// @ts-ignore @ember/modifier does not provide types :(
import { on } from '@ember/modifier';
import { setOwner } from '@ember/owner';
import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { resource } from 'ember-resources';

module('RAW', function (hooks) {
  setupTest(hooks);

  test('in plain js', async function (assert) {
    let thing = resource(() => 2);
    let parent = {};

    setOwner(parent, this.owner);

    let instance = thing.create();

    instance.link(parent);
    assert.strictEqual(instance.current, 2);
  });

  test('owner required', async function (assert) {
    let thing = resource(() => 2);

    assert.throws(() => {
      let instance = thing.create();

      instance.current;
    }, /Cannot create a resource without an owner/);
  });

  test('owner missing', async function (assert) {
    let thing = resource(() => 2);

    assert.throws(() => {
      let instance = thing.create();

      instance.link({});

      instance.current;
    }, /Cannot link without an owner/);
  });
});
