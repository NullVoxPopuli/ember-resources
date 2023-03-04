import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

// import { use } from 'ember-resources';
import { trackedFunction } from 'ember-resources/util/function';

const formatError = (error: unknown) => {
  return `Hey!, ${error}`;
}

export default class GlintTest extends Component {
  @tracked input = 2;

  aMap = trackedFunction(this, async () => {
    return Promise.resolve('hi');
  });

  // Not yet supported
  // @use bMap = trackedFunction(async () => {
  //   return Promise.resolve('hello');
  // });


  <template>
    isLoading: {{if this.aMap.isPending 'true' 'false'}}
    isError: {{if this.aMap.isRejected 'true' 'false'}}
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
