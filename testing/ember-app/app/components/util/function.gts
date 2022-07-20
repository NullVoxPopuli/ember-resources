import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import {action} from "@ember/object"

import { trackedFunction, executeTrackedFunction } from 'ember-resources/util/function';

const log = (d) => console.log(d)

const formatError = (error: unknown) => {
  return `Hey!, ${error}`;
}

export default class GlintTest extends Component {
  @tracked input = 2;

  @tracked aMap = trackedFunction(this, async () => {
    console.log("FN Started")
    const input = this.input
    return Promise.resolve(new Promise(
      (res) => setTimeout(
        () => {
          console.log("FN Finished")
          res(input * Math.random())
        },
        1000
      )
    ));
  });

  @action
  increase(){
    this.input++
  }

  @action
  executeTracked(){
    const state = this.aMap.execute();
    console.log(state.value, this.aMap.value);
  }



  // Not yet supported
  // @use bMap = trackedFunction(async () => {
  //   return Promise.resolve('hello');
  // });


  <template>
    isLoading: {{if this.aMap.isLoading 'true' 'false'}}
    isError: {{if this.aMap.isError 'true' 'false'}}
    isPending: {{if this.aMap.isPending 'true' 'false'}}
    isResolved: {{if this.aMap.isResolved 'true' 'false'}}

    <p>
    {{#if this.aMap.isResolved}}
      {{this.aMap.value}}
    {{else}}
      Loading...
    {{/if}}
    </p>

    <button {{on "click" this.increase}}>+</button>
    <button {{on "click" this.executeTracked}}>Run</button>

    {{#if this.aMap.error}}
      {{formatError this.aMap.error}}
    {{/if}}
  </template>
}
