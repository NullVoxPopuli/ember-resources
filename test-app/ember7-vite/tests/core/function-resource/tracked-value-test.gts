import { tracked } from '@glimmer/tracking';
import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { resource } from 'ember-resources';

/**
 * `tracked(initialValue)` creates a standalone TrackedValue on
 * ember-source >= 7.3.0-alpha.2. Returning one from a resource
 * unwraps it, the same way returning a Cell does.
 */
module('Utils | (function) resource | TrackedValue', function (hooks) {
  setupRenderingTest(hooks);

  test(`returning a TrackedValue renders its value`, async function (assert) {
    // the runtime unwrap isn't reflected in resource()'s types, so glint
    // doesn't know the rendered value is the TrackedValue's inner value
    const StuckClock = resource(() => tracked(2)) as unknown as number;

    await render(<template>{{StuckClock}}</template>);

    assert.dom().hasText('2');
  });

  test(`updating the TrackedValue re-renders`, async function (assert) {
    const count = tracked(0);
    const Count = resource(() => count) as unknown as number;

    await render(<template>{{Count}}</template>);

    assert.dom().hasText('0');

    count.value = 1;
    await settled();

    assert.dom().hasText('1');
  });

  test(`a use()-d resource returning a TrackedValue unwraps via .current`, async function (assert) {
    const count = tracked(3);
    const Inner = resource(() => count);
    const Doubled = resource(({ use }) => {
      const inner = use(Inner);

      return () => Number(inner.current) * 2;
    });

    await render(<template>{{Doubled}}</template>);

    assert.dom().hasText('6');

    count.value = 5;
    await settled();

    assert.dom().hasText('10');
  });
});
