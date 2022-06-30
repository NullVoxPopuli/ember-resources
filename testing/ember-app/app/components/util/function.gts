import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { trackedFunction, executeTrackedFunction } from 'ember-resources/util/function';

const log = (d) => console.log(d)

const formatError = (error: unknown) => {
  return `Hey!, ${error}`;
}

export default class GlintTest extends Component {
  @tracked input = 2;

  @tracked aMap = trackedFunction(this, async () => {
               const input = this.input
    return Promise.resolve(new Promise((res)=>setTimeout(()=>res(Math.random() * input) ,1000))
    );
  });

  increase(){
    this.input++
  }

  executeTracked(){
    this.aMap = executeTrackedFunction(this.aMap)
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

    {{#if this.aMap.value}}
      {{this.aMap.value}}
    {{/if}}

    {{#if this.aMap.error}}
      {{formatError this.aMap.error}}
    {{/if}}
  </template>
}
