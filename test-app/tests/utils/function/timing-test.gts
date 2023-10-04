import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { click, render, settled } from '@ember/test-helpers';
// @ts-ignore
import { on } from '@ember/modifier';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setOwner } from '@ember/application';

import { cell, use, resource, resourceFactory } from 'ember-resources';
import { trackedFunction } from 'ember-resources/util/function';

const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

module('Utils | trackedFunction | timing', function (hooks) {
  setupRenderingTest(hooks);

  test('With Argument', async function (assert) {
    let step = (msg: string) => assert.step(msg);

    let state = cell(0);

    async function fn(value) {
      step(`fn:begin:${value}`);
      await Promise.resolve();
      step(`fn:end:${value}`);
      return 'yay';
    }

    const WithArgument = resourceFactory(num => resource(({ use }) => {
      return use(trackedFunction(() => fn(num)));
    }));

    await render(
      <template>
        {{#let (WithArgument state.current) as |request|}}
          {{#if request.isLoading}}
            {{step 'loading'}}
          {{else if request.isError}}
            {{step 'error'}}
          {{else if request.value}}
            {{step 'loaded'}}
          {{/if}}
        {{/let}}
      </template>
    );

    assert.verifySteps([
      'fn:begin:0', 'loading', 'fn:end:0', 'loaded'
    ]);

    state.current = 1;
    await settled();

    assert.verifySteps([
      'fn:begin:1', 'loading', 'fn:end:1', 'loaded'
    ]);
  });
});
