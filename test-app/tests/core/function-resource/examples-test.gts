import Component from '@glimmer/component';
import { associateDestroyableChild, registerDestructor } from '@ember/destroyable';
import { render, settled } from '@ember/test-helpers';
import { module, skip,test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { cell,resource, use } from 'ember-resources';

module('resource | example', function (hooks) {
  setupRenderingTest(hooks);

  module('Custom lifecycle can be managed', function() {
    module('destruction', function() {
      test('works as expected when invoked in instance-space', async function(assert) {
        function Wrapper(parent: object, argsFn: () => Record<string, unknown>) {
          assert.step('create:Wrapper');

          let obj = {};
          let destroyable = resource(({on}) => {
            assert.step('create:resource');
            on.cleanup(() => { assert.step('destroy:resource')});

            return argsFn()[ 'foo' ];
          });

          associateDestroyableChild(parent, obj);
          registerDestructor(obj, () => assert.step('destroy:obj'));

          return destroyable;
        }

        const isVisible = cell(true);

        class Demo extends Component {
          @use data = Wrapper(this, () => this.args) as string;

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


        assert.verifySteps(['destroy:obj', 'destroy:resource'])

      });

    // This test isn't possible to go greet, _due to JavaScript_
      skip('can use the `this`', async function(assert) {
        // function Wrapper will not have a `this`
        //   because it's invoked in a class.
        // if we use an arrow, we inherit the `this` of the test
        //   because the `this` is inherited wherever the function is
        //   defined, not where it is invoked.
        function Wrapper(argsFn: () => Record<string, unknown>) {
          assert.step('create:Wrapper');

          let obj = {};
          let destroyable = resource(({on}) => {
            assert.step('create:resource');
            on.cleanup(() => { assert.step('destroy:resource')});

            return argsFn()[ 'foo' ];
          });

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          associateDestroyableChild(this, obj);
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


        assert.verifySteps(['destroy:obj', 'destroy:resource'])

      });
    });
  });
});
