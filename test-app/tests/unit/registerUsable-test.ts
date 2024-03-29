import { assert as debugAssert } from '@ember/debug';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { capabilities, invokeHelper, setHelperManager } from '@ember/helper';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { registerUsable, use } from 'ember-resources';

interface Usable {
  type: string;
  definition: unknown;
}

module('API | registerUsable', function (hooks) {
  setupRenderingTest(hooks);

  test('rando, non-usable errors', async function (assert) {
    assert.expect(1);

    class Demo {
      @use foo = {};
    }

    let instance = new Demo();

    const expectedMessage = `@use to have been a registerd "usable". Available usables are:`;

    try {
      instance.foo;
      assert.notOk(true, 'Should not get here');
    } catch (e) {
      // Not until TS 4.9 is the default "e" an `unknown` type
      let error = e as any;

      debugAssert(
        'Expected error to have a message property',
        typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof error.message === 'string'
      );

      assert.ok(
        error.message.match(new RegExp(expectedMessage)),
        `Expected '${error.message}' to include '${expectedMessage}'`
      );
    }
  });

  test('a custom usable is @use-able', async function (assert) {
    class ReturnANumberManager {
      capabilities = capabilities('3.23', { hasValue: true });

      createHelper(config: Usable) {
        return config.definition;
      }

      getValue(fn: () => unknown) {
        // "behavior" lol
        return Number(fn());
      }
    }

    function returnANumber(fn: () => any) {
      const helper = {
        type: 'my-custom-usable',
        definition: fn,
      };

      setHelperManager(() => new ReturnANumberManager(), helper);

      return helper as unknown as number;
    }

    registerUsable('my-custom-usable', (context, config) => {
      return invokeHelper(context, config);
    });

    class Demo {
      @use foo = returnANumber(() => '12');
    }

    let instance = new Demo();

    assert.strictEqual(instance.foo, 12);
  });
});
