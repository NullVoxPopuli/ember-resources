import '@ember/component';
import type {TemplateFactory} from 'ember-cli-htmlbars';

type TF = TemplateFactory;

declare module '@ember/component' {
  export function setComponentManager<T>(managerId: string, baseClass: T): T;
  export function setComponentManager<T>(managerFactory: (owner: any) => {}, baseClass: T): T;
  export function setComponentTemplate(template: TF, context: unknown): unknown;
  export function capabilities(
    version: string,
    opts?: {
      destructor?: boolean;
      asyncLifecycleCallbacks?: boolean;
      updateHook?: boolean;
    }
  ): any;
}
