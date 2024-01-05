import { tracked } from '@glimmer/tracking';
// @ts-ignore @ember/helper does not provide types :(
import { fn, hash } from '@ember/helper';
import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { use } from 'ember-resources';
import { trackedFunction } from 'ember-resources/util/function';
import { keepLatest } from 'ember-resources/util/keep-latest';

const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

module('Utils | keepLatest | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    class Test {
      @tracked x = 1;

      // @use request = trackedFunction(async () => {
      request = trackedFunction(this, async () => {
        let value = this.x;

        await timeout(30);

        return value;
      });
    }

    let instance = new Test();

    let passthrough = <T>(x: T) => x;

    render(<template>
      {{#let instance.request as |request|}}
        {{keepLatest (hash
          when=(fn passthrough request.isPending)
          value=(fn passthrough request.value)
        )}}
      {{/let}}
    </template>);

    await timeout(10);

    assert.dom().hasNoText();

    await settled();

    assert.dom().hasText('1');

    instance.x = 2;

    assert.dom().hasText('1');
    await timeout(15);
    assert.dom().hasText('1');
    await timeout(40);
    assert.dom().hasText('2');
  });

  test('if the previous value is not empty, and the current value is empty', async function (assert) {
    class Test {
      @tracked x: number[] | number = [];

      // @use request = trackedFunction(async () => {
      request = trackedFunction(this, async () => {
        let value = this.x;

        await timeout(10);

        return value;
      });

      @use data = keepLatest({
        when: () => this.request.isPending,
        value: () => this.request.value,
      })
    }

    let instance = new Test();

    await render(<template>{{JSON.stringify instance.data}}</template>);

    assert.dom().hasText('[]');

    instance.x = [1];
    await settled();
    assert.dom().hasText('[1]');

    instance.x = [];
    await timeout(8);
    assert.dom().hasText('[1]');
    await settled();
    assert.dom().hasText('[]');

    instance.x = 0;
    await timeout(8);
    assert.dom().hasText('[]');

    await settled();
    assert.dom().hasText('0');

    instance.x = [1];
    await timeout(8);
    assert.dom().hasText('0');

    await settled();
    assert.dom().hasText('[1]');

    instance.x = [1, 2];
    assert.dom().hasText('[1]');
    await timeout(8);
    assert.dom().hasText('[1]');

    await settled();
    assert.dom().hasText('[1,2]');
  });

  test('with a default value, if the previous value is not empty, and the current value is empty', async function (assert) {
    class Test {
      @tracked x: number[] | null | number = [];

      // @use request = trackedFunction(async () => {
      request = trackedFunction(this, async () => {
        let value = this.x;

        await timeout(10);

        return value;
      });

      @use latest = keepLatest({
        when: () => this.request.isPending,
        value: () => this.request.value,
      })

      get data() {
        return this.latest ?? 'default';
      }
    }

    let instance = new Test();

    render(<template>{{JSON.stringify instance.data}}</template>);

    await timeout(8);
    /**
      * Initially, a `trackedFunction` returns null.
      * we could craft a resource that returns something other than null,
      * initially, but null ?? 'default' is 'default'.
      */
    assert.dom().hasText('"default"', 'pre-settled, value exists ');
    await settled();
    assert.dom().hasText('[]', 'value exists, and set explicitly');

    instance.x = [1];
    await settled();
    assert.dom().hasText('[1]', 'non-empty value exists and set explicitly');

    instance.x = [];
    await timeout(8);
    assert.dom().hasText('[1]', 'retains previous value of [1]');
    await settled();
    assert.dom().hasText('[]', 'value resolved to empty []');

    instance.x = null;
    await timeout(8);
    assert.dom().hasText('[]', 'retains previous value of []');

    await settled();
    assert.dom().hasText('"default"', 'empty value set, falling back to default');

    instance.x = [1];
    await timeout(8);
    assert.dom().hasText('"default"', 'not yet resolved, previous value used');

    await settled();
    assert.dom().hasText('[1]', 'value resolved to [1]');

    instance.x = [1, 2];
    assert.dom().hasText('[1]', 'retains previous non-empty value');
    await timeout(8);
    assert.dom().hasText('[1]', 'retains previous non-empty value');

    await settled();
    assert.dom().hasText('[1,2]', 'new value is resolved');
  });
});
