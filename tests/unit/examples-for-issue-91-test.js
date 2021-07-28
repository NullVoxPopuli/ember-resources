import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { destroy } from '@ember/destroyable';
import { click, render, settled } from '@ember/test-helpers';
import { waitFor, waitForPromise } from '@ember/test-waiters';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { timeout } from 'ember-concurrency';
import { LifecycleResource, useFunction, useResource } from 'ember-resources';

module('useResource - issue#91', function (hooks) {
  setupTest(hooks);

  test('useResource', async function (assert) {
    class CompanyResource extends LifecycleResource {
      @tracked _company;

      get company() {
        console.log('company');
        return this._company ?? {};
      }

      setup() {
        this.doAsyncTask();
      }

      update() {
        this.doAsyncTask();
      }

      async doAsyncTask() {
        console.log('before');
        this._company = await findAll('company'); // weirdness of the API, don't ask
        console.log('after');
      }
    }

    class ConsumingContext {
      myResource = useResource(this, CompanyResource /* no thunk, no call to update */);
    }

    let instance = new ConsumingContext();

    assert.deepEqual(instance.myResource.company, {});
    await settled();

    assert.deepEqual(instance.myResource.company, 'company');
  });

  test('vanilla', async function (assert) {
    class CompanyResource extends LifecycleResource {
      @tracked _company;

      get company() {
        console.log('company');
        return this._company ?? {};
      }

      setup() {
        this.doAsyncTask();
      }

      update() {
        this.doAsyncTask();
      }

      async doAsyncTask() {
        console.log('before');
        this._company = await findAll('company'); // weirdness of the API, don't ask
        console.log('after');
      }
    }

    let instance = new CompanyResource(this.owner, {});

    assert.deepEqual(instance.company, {});
    await settled();

    assert.deepEqual(
      instance.company,
      {},
      'setup doesnt run, because the Resource manager wasnt used -- provided by useREsource'
    );
  });

  test('using functions instead', async function (assert) {
    class ConsumingContext {
      myResource = useFunction(this, {}, async () => {
        return findAll('company');
      });
    }

    let instance = new ConsumingContext();

    assert.deepEqual(instance.myResource.value, {});
    await settled();

    assert.deepEqual(instance.myResource.value, 'company');
  });
});

async function findAll(name) {
  let promise = new Promise((resolve) => setTimeout(resolve, 100));

  await waitForPromise(promise);
  return Promise.resolve(name);
}
