// import type Ember from 'ember';

import '@glint/environment-ember-loose';
import '@glint/environment-ember-loose/native-integration';
import '@glint/environment-ember-template-imports';

import type { ExpandSignature } from '@glimmer/component/-private/component';
import type {
  FlattenBlockParams,
  HasContext,
  TemplateContext,
} from '@glint/template/-private/integration';

declare global {
  // interface Array<T> extends Ember.ArrayPrototypeExtensions<T> {}
  // interface Function extends Ember.FunctionPrototypeExtensions {}
}

export {};

import '@ember/component';
import '@ember/test-helpers';
import 'ember-cli-htmlbars';

import type Owner from '@ember/owner';

type TestTemplate<T, A, B, E> = abstract new () => HasContext<TemplateContext<T, A, B, E>>;

declare module '@ember/test-helpers' {
  export function render<T>(template: TestTemplate<T, any, any, any>): Promise<void>;
}

// Declaring that `TemplateFactory` is a valid `TestTemplate` prevents vanilla `tsc` from freaking out
// about `hbs` not returning a valid type for `render`. Glint itself will never see `hbs` get used, as
// it's transformed to the template DSL before typechecking.
declare module 'ember-cli-htmlbars' {
  interface TemplateFactory extends TestTemplate<any, any, any, any> {}
}

declare module '@ember/component' {
  export function setComponentManager<T>(managerId: string, baseClass: T): T;
  // eslint-disable-next-line @typescript-eslint/ban-types
  export function setComponentManager<T>(managerFactory: (owner: any) => {}, baseClass: T): T;

  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  type Component = import('@glimmer/component').default;

  type InferSignature<T> = T extends Component<infer Signature> ? Signature : 'nevwhyer';
  type ComponentContext<This, S> = TemplateContext<
    This,
    ExpandSignature<S>['Args']['Named'],
    FlattenBlockParams<ExpandSignature<S>['Blocks']>,
    ExpandSignature<S>['Element']
  >;

  export function setComponentTemplate<
    Klass extends abstract new (owner: Owner, args: any) => Instance,
    Instance = InstanceType<Klass>,
    S = InferSignature<Instance>
  >(template: abstract new () => HasContext<ComponentContext<Instance, S>>, klass: Klass): Klass;

  export function capabilities(
    version: string,
    opts?: {
      destructor?: boolean;
      asyncLifecycleCallbacks?: boolean;
      updateHook?: boolean;
    }
  ): any;
}
