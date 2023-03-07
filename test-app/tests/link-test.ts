import { setOwner } from '@ember/application';
import Service, { inject as service } from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { link } from 'ember-resources/link';

module('@link', function (hooks) {
  setupTest(hooks);

  class FooService extends Service {
    bar = 2;
  }

  test('works with no initializer', async function (assert) {
    this.owner.register('service:foo', FooService);

    class Demo {
      @service declare foo: FooService;
    }

    class TestDemo {
      @link(Demo) declare demo: Demo;
    }

    let testDemo = new TestDemo();

    setOwner(testDemo, this.owner);

    assert.strictEqual(testDemo.demo.foo.bar, 2);
  });

  test('works with initializer', async function (assert) {
    this.owner.register('service:foo', FooService);

    class Demo {
      @service declare foo: FooService;
    }

    class TestDemo {
      @link demo = new Demo();
    }

    let testDemo = new TestDemo();

    setOwner(testDemo, this.owner);

    assert.strictEqual(testDemo.demo.foo.bar, 2);
  });
});

module('link', function (hooks) {
  setupTest(hooks);

  class FooService extends Service {
    foo = 2;
  }

  test('it works', async function (assert) {
    this.owner.register('service:foo', FooService);

    class Demo {
      @service declare foo: FooService;
    }

    let demo = new Demo();

    link(demo, this);

    assert.strictEqual(demo.foo.foo, 2);
  });
});
