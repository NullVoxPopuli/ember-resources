import { tracked } from '@glimmer/tracking';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { setupMSW } from 'ember-app/tests/msw';
import { RemoteData } from 'ember-resources/util/remote-data';

let data = [
  { id: '1', type: 'blogs', attributes: { name: `name:1` } },
  { id: '2', type: 'blogs', attributes: { name: `name:2` } },
  { id: '3', type: 'blogs', attributes: { name: `name:3` } },
];

module('Utils | remote-data | rendering', function (hooks) {
  setupRenderingTest(hooks);
  setupMSW(hooks, ({ rest }) => [
    rest.get('/blogs/:id', (req, res, ctx) => {
      let record = data.find((datum) => datum.id === req.params.id);

      return res(ctx.json({ ...record }));
    }),
  ]);

  module('RemoteData', function () {
    test('works with static url', async function (assert) {
      this.setProperties({ RemoteData });

      await render(hbs`
        {{#let (this.RemoteData "/blogs/1") as |blog|}}
          {{blog.value.attributes.name}}
        {{/let}}
      `);

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

      this.setProperties({ RemoteData, foo });

      await render(hbs`
        {{#let (this.RemoteData this.foo.url) as |blog|}}
          {{blog.value.attributes.name}}
        {{/let}}
      `);

      assert.dom().hasText('name:1');

      foo.id = 2;
      await settled();

      assert.dom().hasText('name:2');
    });
  });
});
