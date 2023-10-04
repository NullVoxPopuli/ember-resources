import Component from '@glimmer/component';
import { concat } from '@ember/helper';
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
      return `yay:${value}`;
    }

    const WithArgument = resourceFactory(num => resource(({ use }) => {
      return use(trackedFunction(() => fn(num)));
    }));

    await render(
      <template>
        {{#let (WithArgument state.current) as |request|}}
          {{#if request.isLoading}}
            {{step 'loading'}}
          {{/if}}
          {{#if request.isError}}
            {{step 'error'}}
          {{/if}}
          {{#if request.value}}
            {{step (concat 'loaded:' request.value)}}
          {{/if}}
        {{/let}}
      </template>
    );

    assert.verifySteps([
      'fn:begin:0', 'loading', 'fn:end:0', 'loaded:yay:0'
    ]);

    state.current = 1;
    await settled();

    assert.verifySteps([
      'fn:begin:1', 'loading', 'fn:end:1', 'loaded:yay:1'
    ]);
  });

  test('From a component class', async function (assert) {
    let step = (msg: string) => assert.step(msg);

    let state = cell(0);

    class Example extends Component<{ Args: { value: unknown } }> {
      request = trackedFunction(this, async () => {
        let value = this.args.value;
        step(`fn:begin:${value}`);
        await Promise.resolve();
        step(`fn:end:${value}`);
        return `yay:${value}`;
      });

      <template>
        {{#if this.request.isPending}}
          {{step 'pending'}}
        {{/if}}
        {{#if this.request.isLoading}}
          {{step 'loading'}}
        {{/if}}
        {{#if this.request.isError}}
          {{step 'error'}}
        {{/if}}
        {{#if this.request.value}}
          {{step (concat 'loaded:' this.request.value)}}
        {{/if}}
        {{#if this.request.isFinished}}
          {{step 'finished'}}
        {{/if}}
      </template>
    }

    await render(
      <template>
        <Example @value={{state.current}} />
      </template>
    );

    assert.verifySteps([
      'fn:begin:0', 'pending', 'loading', 'fn:end:0', 'loaded:yay:0', 'finished'
    ]);

    state.current = 1;
    await settled();

    assert.verifySteps([
      'fn:begin:1', 'pending', 'loading', 'fn:end:1', 'loaded:yay:1', 'finished'
    ]);
  });
});
