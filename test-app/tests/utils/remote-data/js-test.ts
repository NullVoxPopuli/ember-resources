import { tracked } from '@glimmer/tracking';
import { setOwner } from '@ember/application';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { resource, use } from 'ember-resources';
import { RemoteData, remoteData } from 'ember-resources/util/remote-data';
import { setupMSW } from 'test-app/tests/msw';

let data = [
  { id: '1', type: 'blogs', attributes: { name: `name:1` } },
  { id: '2', type: 'blogs', attributes: { name: `name:2` } },
  { id: '3', type: 'blogs', attributes: { name: `name:3` } },
];

module('Utils | remote-data | js', function (hooks) {
  setupTest(hooks);
  setupMSW(hooks, ({ rest }) => [
    rest.get('/blogs/:id', (req, res, ctx) => {
      let record = data.find((datum) => datum.id === req.params['id']);

      if (record) {
        let extra: Record<string, unknown> = {};

        /**
         * The Authorization header here is used in testing to
         * assert that headers were passed successfully
         *
         * all of the lifecycle is abstracted away in the `RemoteData` api
         */
        if (req.headers.get('Authorization')) {
          extra['Authorization'] = req.headers.get('Authorization');
        }

        return res(ctx.json({ ...record, ...extra }));
      }

      return res(
        ctx.status(404),
        ctx.json({ errors: [{ status: '404', detail: 'Blog not found' }] })
      );
    }),
    rest.get('/text-error/:id', (req, res, ctx) => {
      return res(ctx.status(500), ctx.text('hello world'));
    }),
    rest.get('/text-success/:id', (req, res, ctx) => {
      return res(ctx.text('hello world'));
    }),
  ]);

  module('RemoteData', function () {
    test('works with static url', async function (assert) {
      class Test {
        @use request = RemoteData('/blogs/1');
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      assert.strictEqual(test.request.status, null);
      assert.true(test.request.isLoading);
      assert.false(test.request.isError);
      assert.false(test.request.isResolved);
      await settled();
      assert.deepEqual(test.request.value, data[0]);
      assert.false(test.request.isLoading);
      assert.false(test.request.isError);
      assert.true(test.request.isResolved);
      assert.strictEqual(test.request.status, 200);
    });

    test('works with static options', async function (assert) {
      class Test {
        @use request = RemoteData('/blogs/1', {
          headers: {
            Authorization: 'Bearer <token>',
          },
        });
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      assert.strictEqual(test.request.status, null);
      assert.true(test.request.isLoading);
      assert.false(test.request.isError);
      assert.false(test.request.isResolved);
      await settled();
      assert.deepEqual(test.request.value, { ...data[0], Authorization: 'Bearer <token>' });
      assert.false(test.request.isLoading);
      assert.false(test.request.isError);
      assert.true(test.request.isResolved);
      assert.strictEqual(test.request.status, 200);
    });

    test('works with reactive url', async function (assert) {
      class Test {
        @tracked url = '/blogs/1';
        @use request = RemoteData(() => this.url);
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      await settled();
      assert.deepEqual(test.request.value, data[0]);

      test.url = '/blogs/2';
      assert.true(test.request.isLoading);
      await settled();
      assert.false(test.request.isLoading);
      assert.deepEqual(test.request.value, data[1]);
    });

    test('works with reactive options', async function (assert) {
      class Test {
        @tracked url = '/blogs/1';
        @tracked apiToken = '<token>';

        @use request = RemoteData(() => ({
          url: this.url,
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        }));
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      await settled();
      assert.deepEqual(test.request.value, { ...data[0], Authorization: 'Bearer <token>' });

      test.apiToken = 'abc, 123';
      assert.true(test.request.isLoading);
      await settled();
      assert.false(test.request.isLoading);
      assert.deepEqual(test.request.value, { ...data[0], Authorization: 'Bearer abc, 123' });
    });

    test('gracefully handles errors', async function (assert) {
      class Test {
        @use request = RemoteData('/blogs/1000');
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      assert.strictEqual(test.request.status, null);
      assert.true(test.request.isLoading);
      assert.false(test.request.isError);
      assert.false(test.request.isResolved);
      await settled();
      assert.deepEqual(test.request.value, {
        errors: [{ detail: 'Blog not found', status: '404' }],
      });
      assert.false(test.request.isLoading);
      assert.true(test.request.isError, 'isError');
      assert.true(test.request.isResolved);
      assert.strictEqual(test.request.status, 404, 'expected status');
    });

    module('works with non-json requests', function () {
      test('text with a successful response', async function (assert) {
        class Test {
          @use request = RemoteData('/text-success/100');
        }

        let test = new Test();

        setOwner(test, this.owner);

        assert.strictEqual(test.request.status, null);
        await settled();

        assert.strictEqual(test.request.value, 'hello world');

        assert.strictEqual(test.request.status, 200);
      });

      test('text with an error response', async function (assert) {
        class Test {
          @use request = RemoteData('/text-error/100');
        }

        let test = new Test();

        setOwner(test, this.owner);

        assert.strictEqual(test.request.status, null);
        await settled();

        assert.strictEqual(test.request.value, 'hello world');

        assert.strictEqual(test.request.status, 500);
      });
    });
  });

  module('remoteData', function () {
    test('works with static url', async function (assert) {
      class Test {
        @use request = resource((api) => remoteData(api, `/blogs/1`));
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      assert.true(test.request.isLoading);
      assert.false(test.request.isError);
      assert.false(test.request.isResolved);
      await settled();
      assert.deepEqual(test.request.value, data[0]);
      assert.false(test.request.isLoading);
      assert.false(test.request.isError);
      assert.true(test.request.isResolved);
    });

    test('works without @use', async function (assert) {
      class Test {
        request = resource(this, (api) => remoteData(api, `/blogs/1`));
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      assert.true(test.request.isLoading);
      assert.false(test.request.isError);
      assert.false(test.request.isResolved);
      await settled();
      assert.deepEqual(test.request.value, data[0]);
      assert.false(test.request.isLoading);
      assert.false(test.request.isError);
      assert.true(test.request.isResolved);
    });

    test('works with static options', async function (assert) {
      class Test {
        @use request = resource((api) =>
          remoteData(api, '/blogs/1', {
            headers: {
              Authorization: 'Bearer <token>',
            },
          })
        );
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      assert.strictEqual(test.request.status, null);
      assert.true(test.request.isLoading);
      assert.false(test.request.isError);
      assert.false(test.request.isResolved);
      await settled();
      assert.deepEqual(test.request.value, { ...data[0], Authorization: 'Bearer <token>' });
      assert.false(test.request.isLoading);
      assert.false(test.request.isError);
      assert.true(test.request.isResolved);
      assert.strictEqual(test.request.status, 200);
    });

    test('works with reactive url', async function (assert) {
      class Test {
        @tracked url = '/blogs/1';
        @use request = resource((api) => remoteData(api, this.url));
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      await settled();
      assert.deepEqual(test.request.value, data[0]);

      test.url = '/blogs/2';
      assert.true(test.request.isLoading);
      await settled();
      assert.false(test.request.isLoading);
      assert.deepEqual(test.request.value, data[1]);
    });

    test('works with reactive options', async function (assert) {
      class Test {
        @tracked url = '/blogs/1';
        @tracked apiToken = '<token>';

        @use request = resource((api) =>
          remoteData(api, this.url, {
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
            },
          })
        );
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      await settled();
      assert.deepEqual(test.request.value, { ...data[0], Authorization: 'Bearer <token>' });

      test.apiToken = 'abc, 123';
      assert.true(test.request.isLoading);
      await settled();
      assert.false(test.request.isLoading);
      assert.deepEqual(test.request.value, { ...data[0], Authorization: 'Bearer abc, 123' });
    });

    test('gracefully handles errors', async function (assert) {
      class Test {
        @use request = resource((api) => remoteData(api, '/blogs/1000'));
      }

      let test = new Test();

      setOwner(test, this.owner);

      assert.strictEqual(test.request.value, null);
      assert.strictEqual(test.request.status, null);
      assert.true(test.request.isLoading);
      assert.false(test.request.isError);
      assert.false(test.request.isResolved);
      await settled();
      assert.deepEqual(test.request.value, {
        errors: [{ detail: 'Blog not found', status: '404' }],
      });
      assert.false(test.request.isLoading);
      assert.true(test.request.isError);
      assert.true(test.request.isResolved);
      assert.strictEqual(test.request.status, 404);
    });
  });
});
