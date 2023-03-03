import '@glint/environment-ember-loose';
import '@glint/environment-ember-loose/native-integration';
import 'ember-page-title/glint';

// import type { ComponentLike, HelperLike, ModifierLike } from "@glint/template";

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    // Examples
    // state: HelperLike<{ Args: {}, Return: State }>;
    // attachShadow: ModifierLike<{ Args: { Positional: [State['update']]}}>;
    // welcome: typeof Welcome;
  }
}
