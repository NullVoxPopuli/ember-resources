import '@glint/environment-ember-loose';
import '@glint/environment-ember-loose/native-integration';

// import type { ComponentLike, HelperLike, ModifierLike } from "@glint/template";
import type Clock from 'test-app/helpers/clock';
import type TimeFormat from 'test-app/helpers/time-format';

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    'clock': typeof Clock & { (): typeof Clock };
    'time-format': typeof TimeFormat;
    // Examples
    // state: HelperLike<{ Args: {}, Return: State }>;
    // attachShadow: ModifierLike<{ Args: { Positional: [State['update']]}}>;
    // welcome: typeof Welcome;
  }
}
