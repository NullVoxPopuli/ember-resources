// Types for compiled templates
declare module 'ember-concurrency-v1-tests/templates/*' {
  import { TemplateFactory } from 'htmlbars-inline-precompile';
  const tmpl: TemplateFactory;
  export default tmpl;
}
