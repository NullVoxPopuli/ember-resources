import { tracked } from '@glimmer/tracking';
import { click, render, settled } from '@ember/test-helpers';
// @ts-ignore
import { on } from '@ember/modifier';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { setupMSW } from 'test-app/tests/msw';
import { RemoteData } from 'ember-resources/util/remote-data';

let data = [
  { id: '1', type: 'blogs', attributes: { name: `name:1` } },
  { id: '2', type: 'blogs', attributes: { name: `name:2` } },
  { id: '3', type: 'blogs', attributes: { name: `name:3` } },
];

let safeName = (blog: any): string => blog?.value?.attributes?.name;

module('Utils | remote-data | rendering', function (hooks) {
  setupRenderingTest(hooks);
  setupMSW(hooks, ({ rest }) => [
    rest.get('/blogs/:id', (req, res, ctx) => {
      let record = data.find((datum) => datum.id === req.params['id']);

      return res(ctx.json({ ...record }));
    }),
  ]);

  module('RemoteData', function () {
    test('works with static url', async function (assert) {
      await render(<template>
        {{#let (RemoteData "/blogs/1") as |blog|}}
          {{safeName blog}}
        {{/let}}
      </template>);

      assert.dom().hasText('name:1');
    });

    test('works with dynamic url', async function (assert) {
      class Test {
        @tracked id = 1;

        get url() {
          return `/blogs/${this.id}`;
        }
      }

      let foo = new Test();

      await render(<template>
        {{#let (RemoteData foo.url) as |blog|}}
          {{safeName blog}}
        {{/let}}
      </template>);

      assert.dom().hasText('name:1');

      foo.id = 2;
      await settled();

      assert.dom().hasText('name:2');
    });

    test('works with an incrementing url', async function (assert) {
      class Test {
        @tracked id = 1;

        get url() {
          return `/blogs/${this.id}`;
        }

        update = () => this.id++;
      }

      let foo = new Test();

      await render(<template>
        {{#let (RemoteData foo.url) as |blog|}}
          <out>{{safeName blog}}</out>
        {{/let}}

        <button {{on 'click' foo.update}} type='button'>++</button>
      </template>);

      assert.dom('out').hasText('name:1');

      await click('button');

      assert.dom('out').hasText('name:2');
    });
  });
});
