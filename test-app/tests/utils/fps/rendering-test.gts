import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
// @ts-ignore
import { on } from '@ember/modifier';
import { click, find, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { use } from 'ember-resources';
import { FrameRate, UpdateFrequency } from 'ember-resources/util/fps';

module('Utils | FPS | rendering', function (hooks) {
  setupRenderingTest(hooks);

  module('FrameRate', function() {
    test('it works', async function (assert) {
      await render(<template>
        <out>{{FrameRate}}</out>
      </template>);


      let text = find('out')?.innerHTML?.trim() || ''

      assert.notStrictEqual(text, '', 'Content is rendered');
    });


  });

  module('UpdateFrequency', function() {
    test('it works', async function (assert) {
      class Demo extends Component {
        @tracked someProp = 0;

        @use updateFrequency = UpdateFrequency(() => this.someProp);

        inc = () => this.someProp++;

        <template>
          <button type="button" {{on "click" this.inc}}>Inc</button>
          <out>{{this.updateFrequency}}</out>
        </template>
      }

      await render(
        <template>
          <Demo />
        </template>
      );

      assert.dom('out').hasText('0', 'Initial value is 0');

      for (let i = 0; i < 100; i++) {
        await click('button');
      }

      let text = find('out')?.innerHTML?.trim() || ''

      assert.notStrictEqual(text, '', 'Content is rendered');
    });
  });

});
