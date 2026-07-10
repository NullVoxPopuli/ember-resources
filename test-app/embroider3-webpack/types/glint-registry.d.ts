import '@glint/environment-ember-loose';
import '@glint/environment-ember-loose/native-integration';

// import type { ComponentLike, HelperLike, ModifierLike } from "@glint/template";

declare module '@glint/environment-ember-loose/registry' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- the registry is augmented via interface merging
  export default interface Registry {
    // Examples
    // state: HelperLike<{ Args: {}, Return: State }>;
    // attachShadow: ModifierLike<{ Args: { Positional: [State['update']]}}>;
    // welcome: typeof Welcome;
  }
}
