import { tracked } from '@glimmer/tracking';
import { module, test } from 'qunit';

module('Decorator test', function (hooks) {
  test('it works', function (assert) {
    class Foo {
      @tracked foo = 2;
    }

    let foo = new Foo();

    assert.strictEqual(foo.foo, 2);

    foo.foo = 4;

    assert.strictEqual(foo.foo, 4);
  });
});
