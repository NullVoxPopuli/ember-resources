import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { resource,use } from 'ember-resources';
import { RemoteData,remoteData } from 'ember-resources/util/remote-data';

const formatError = (error: unknown) => {
  return `Hey!, ${error}`;
}

const stringify = (obj: unknown) => JSON.stringify(obj, null, 2);

export default class GlintTest extends Component {
  @tracked input = 2;

  @use aData = resource(hooks => remoteData(hooks, `https://${this.input}`));
  @use bData = RemoteData(() => `https://${this.input}`);
  @use cData = RemoteData(`https://${this.input}`);

  <template>
    {{!-- Direct inovcations --}}

    {{#let (RemoteData "/my-api.json") as |state|}}
      status: {{state.status}}
      isLoading: {{if state.isLoading 'true' 'false'}}
      isError: {{if state.isError 'true' 'false'}}
      isPending: {{if state.isPending 'true' 'false'}}
      isResolved: {{if state.isResolved 'true' 'false'}}

      {{stringify state.value}}
      {{formatError state.error}}
    {{/let}}

    {{!-- Usage from JS Context --}}

    status: {{this.aData.status}}
    isLoading: {{if this.aData.isLoading 'true' 'false'}}
    isError: {{if this.aData.isError 'true' 'false'}}
    isPending: {{if this.aData.isPending 'true' 'false'}}
    isResolved: {{if this.aData.isResolved 'true' 'false'}}

    status: {{this.bData.status}}
    isLoading: {{if this.bData.isLoading 'true' 'false'}}
    isError: {{if this.bData.isError 'true' 'false'}}
    isPending: {{if this.bData.isPending 'true' 'false'}}
    isResolved: {{if this.bData.isResolved 'true' 'false'}}

    status: {{this.cData.status}}
    isLoading: {{if this.cData.isLoading 'true' 'false'}}
    isError: {{if this.cData.isError 'true' 'false'}}
    isPending: {{if this.cData.isPending 'true' 'false'}}
    isResolved: {{if this.cData.isResolved 'true' 'false'}}

    {{stringify this.aData.value}}
    {{stringify this.bData.value}}
    {{stringify this.cData.value}}

    {{formatError this.aData.error}}
    {{formatError this.bData.error}}
    {{formatError this.cData.error}}

  </template>
}
