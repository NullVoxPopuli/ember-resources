// ember-concurrency does not allow the usage of the built in types
// import 'ember-source/types';
// import 'ember-source/types/preview';

import '@ember/helper';
declare module '@ember/helper' {
  export function invokeHelper(...args: any[]): any;
}
