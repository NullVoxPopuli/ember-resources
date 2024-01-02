import Component from '@glimmer/component';
import { find,render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell, Resource, resource } from 'ember-resources';
import { service, serviceOverride } from 'ember-resources/service';
// This export is marked as @internal, so it is not present in
// the built d.ts files.
// @ts-expect-error - types are deliberately not exported
import { __secret_service_cache__ } from 'ember-resources/service';

import type Owner from '@ember/owner';

const CACHE = __secret_service_cache__ as WeakMap<Owner, Map<object, any>>;

module('@service | rendering', function (hooks) {
  setupRenderingTest(hooks);

  const Clock = resource(({ on }) => {
    let time = cell(new Date());
    let interval = setInterval(() => {
      time.current = new Date();
    }, 1000);


    on.cleanup(() => {
      clearInterval(interval);
    });

    return () => time.current;
  });

  let counter = 0;

  class APIWrapper extends Resource {
    /**
      * Adding a counter here allows us to roughly measure
    * that the service is only created once for a given test.
      */
    hello = 'world' + counter;
  }

  let asString = (x: unknown) => `${x}`;

  test('it works', async function (assert) {
    class Demo extends Component {
      @service(Clock) declare clock: Date;
      @service(APIWrapper) declare api: APIWrapper;

      <template>
        <time>{{asString this.clock}}</time>
        <out>{{this.api.hello}}</out>
      </template>
    }

    await render(
      <template>
        <div id="one"><Demo /></div>
        <div id="two"><Demo /></div>
      </template>
    );

    // Ensure that #one and #two have the same text
    let helloText = find('#one out')?.textContent?.trim() || `<no text found!!>`;
    let clockText = find('#one time')?.textContent?.trim() || `<no text found!!>`;

    assert.dom('#two time').hasText(clockText);
    assert.dom('#two out').hasText(helloText);

    assert.strictEqual(CACHE.get(this.owner)?.size, 2, 'only two services were created');
  });

  test('Sub classing works', async function (assert) {
    class AuthenticatedAPI extends APIWrapper {
      hello = 'there';
    }

    class Demo extends Component {
      @service(APIWrapper) declare api: APIWrapper;

      <template>
        <out>{{this.api.hello}}</out>
      </template>
    }

    serviceOverride(this.owner, {
      replacement: AuthenticatedAPI,
      original: APIWrapper
    });

    await render(
      <template>
        <div id="one"><Demo /></div>
        <div id="two"><Demo /></div>
      </template>
    );

    // Ensure that #one and #two have the same text
    let helloText = find('#one out')?.textContent?.trim() || `<no text found!!>`;

    assert.dom('#one out').hasText('there');
    assert.dom('#two out').hasText(helloText);

    assert.strictEqual(CACHE.get(this.owner)?.size, 1, 'only one service(s) were created');
  });
});
