import Component from '@glimmer/component';
import { associateDestroyableChild, registerDestructor } from '@ember/destroyable';
import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell,resource, use } from 'ember-resources';

module('resource | example', function (hooks) {
  setupRenderingTest(hooks);

  module('Custom lifecycle can be managed', function() {
    test('destruction works as expected with delayed-accessed-args', async function(assert) {
      function Wrapper(argsFn: () => Record<string, unknown>) {
        assert.step('create:Wrapper');

        let obj = {};
        let destroyable = resource(({on}) => {
          assert.step('create:resource');
          on.cleanup(() => { assert.step('destroy:resource')});

          return argsFn()[ 'foo' ];
        });

        associateDestroyableChild(destroyable as object, obj);
        registerDestructor(obj, () => assert.step('destroy:obj'));

        return destroyable;
      }

      const isVisible = cell(true);

      class Demo extends Component {
        @use data = Wrapper(() => this.args) as string;

        <template>
          {{this.data}}
        </template>
      }

      await render(<template>
      {{#if isVisible.current}}
          <Demo />
      {{/if}}
      </template>);

      assert.verifySteps(['create:Wrapper', 'create:resource'])

      isVisible.current = false;
        await settled();


      assert.verifySteps(['destroy:resource', 'destroy:obj'])

    });
  });
});
