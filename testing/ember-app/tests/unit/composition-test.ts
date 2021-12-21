/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable ember/no-get */
import { tracked } from '@glimmer/tracking';
import { setOwner } from '@ember/application';
import { get as consumeTag } from '@ember/object';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { useFunction } from 'ember-resources';

module('composition of hooks', function () {
  module('in js', function (hooks) {
    setupTest(hooks);

    module('useFunction ∘ useFunction', function () {
      test('basics work', async function (assert) {
        class Test {
          rand = useFunction(this, () => {
            return useFunction(this, () => Math.random());
          });
        }

        let foo = new Test();

        setOwner(foo, this.owner);

        // @ts-ignore
        consumeTag(foo, 'rand.value.value');

        assert.strictEqual(foo.rand.value?.value, undefined);
        await settled();

        assert.notEqual(foo.rand.value?.value, undefined);
      });

      test('persistent state within inner function', async function (assert) {
        class Test {
          @tracked offset = 1;

          rand = useFunction(this, () => {
            let result: Array<number | undefined> = [];

            let innerFunction = useFunction<typeof result>(
              this,
              (prev, offset: number) => {
                let newValue = Math.random() + offset;

                result = [...(prev || []), newValue];

                return result;
              },
              () => [this.offset]
            );

            return innerFunction;
          });
        }

        let foo = new Test();

        setOwner(foo, this.owner);

        // @ts-ignore
        consumeTag(foo, 'rand.value.value');

        assert.strictEqual(foo.rand.value?.value, undefined);
        await settled();

        assert.strictEqual(foo.rand.value.value.length, 1);
        assert.notEqual(foo.rand.value.value[0], undefined);

        let originalFirst = foo.rand.value.value[0];

        foo.offset = 2;

        await settled();

        // @ts-ignore
        consumeTag(foo, 'rand.value.value');
        await settled();

        assert.strictEqual(foo.rand.value.value.length, 2);
        assert.notEqual(foo.rand.value.value[0], undefined);
        assert.notEqual(foo.rand.value.value[1], undefined);
        assert.strictEqual(originalFirst, foo.rand.value.value[0]);
        assert.true((foo.rand.value.value[1] ?? -1) > 2);
      });

      test('persistent state with outer and within inner function', async function (assert) {
        interface Previous {
          value: Array<number | undefined>;
          previous: { innerFunction: { value: Array<number | undefined> }; storeName: string };
        }
        class Test {
          @tracked id = 1;
          @tracked storeName = 'blogs';

          records = useFunction(
            this,
            (state: Previous | undefined, storeName) => {
              let result: Array<string | undefined> = [];

              if (state?.previous?.storeName === storeName) {
                return state.previous.innerFunction;
              }

              let innerFunction = useFunction<typeof result>(
                this,
                (prev, id: number) => {
                  // pretend we fetched a record using the store service
                  let newValue = `record:${storeName}-${id}`;

                  result = [...(prev || []), newValue];

                  return result;
                },
                () => [this.id]
              );

              return new Proxy(innerFunction, {
                get(target, key, receiver) {
                  if (key === 'previous') {
                    return {
                      innerFunction,
                      storeName,
                    };
                  }

                  return Reflect.get(target, key, receiver);
                },
              });
            },
            () => [this.storeName]
          );
        }

        let foo = new Test();

        setOwner(foo, this.owner);

        // @ts-ignore
        consumeTag(foo, 'records.value.value');

        assert.strictEqual(foo.records.value?.value, undefined);
        await settled();

        assert.strictEqual(foo.records.value.value.length, 1);
        assert.strictEqual(foo.records.value.value[0], 'record:blogs-1');

        foo.id = 2;

        await settled();

        // @ts-ignore
        consumeTag(foo, 'records.value.value');
        await settled();

        assert.strictEqual(foo.records.value.value.length, 2);
        assert.strictEqual(foo.records.value.value[0], 'record:blogs-1');
        assert.strictEqual(foo.records.value.value[1], 'record:blogs-2');

        foo.id = 4;
        foo.storeName = 'posts';

        await settled();

        // @ts-ignore
        consumeTag(foo, 'records.value.value');
        await settled();

        assert.strictEqual(foo.records.value.value.length, 1);
        assert.strictEqual(foo.records.value.value[0], 'record:posts-4');
      });
    });
  });
});
