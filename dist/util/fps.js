import { deprecate } from '@ember/debug';
import '../core/class-based/manager.js';
import '@glimmer/tracking/primitives/cache';
import '@ember/application';
import '@ember/helper';
import { resourceFactory } from '../core/function-based/immediate-invocation.js';
import { resource } from '../core/function-based/resource.js';
import '@ember/destroyable';
import { c as cell } from '../cell-8gZlr81z.js';

deprecate(`importing from 'ember-resources/util/fps' is deprecated and will be removed in ember-resources@v7. ` + `The exact same code and support is available at https://github.com/universal-ember/reactiveweb. ` + `\`pnpm add reactiveweb\` and then \` import { FrameRate, UpdateFrequency } from 'reactiveweb/fps';\`. ` + `See also: https://github.com/NullVoxPopuli/ember-resources/issues/1061`, false, {
  id: `ember-resources.util.fps`,
  until: `7.0.0`,
  for: `ember-resources`,
  url: `https://reactive.nullvoxpopuli.com/modules/fps.html`,
  since: {
    available: '6.4.4',
    enabled: '6.4.4'
  }
});

/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but is an example utility to demonstrate a concept when authoring your own resources. However, this utility is still under the broader library's SemVer policy.
 *
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * </div>
 *
 * Utility that uses requestAnimationFrame to report
 * how many frames per second the current monitor is
 * rendering at.
 *
 * The result is rounded to two decimal places.
 *
 * ```js
 * import { FrameRate } from 'ember-resources/util/fps';
 *
 * <template>
 *   {{FrameRate}}
 * </template>
 * ```
 */
const FrameRate = resource(({
  on
}) => {
  let value = cell(0);
  let startTime = new Date().getTime();
  let frame;
  let update = () => {
    // simulate receiving data as fast as possible
    frame = requestAnimationFrame(() => {
      value.current++;
      update();
    });
  };
  on.cleanup(() => cancelAnimationFrame(frame));

  // Start the infinite requestAnimationFrame chain
  update();
  return () => {
    let elapsed = (new Date().getTime() - startTime) * 0.001;
    let fps = value.current * Math.pow(elapsed, -1);
    let rounded = Math.round(fps * 100) * 0.01;
    // account for https://stackoverflow.com/a/588014/356849
    let formatted = `${rounded}`.substring(0, 5);
    return formatted;
  };
});

/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but is an example utility to demonstrate a concept when authoring your own resources. However, this utility is still under the broader library's SemVer policy.
 *
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * </div>
 *
 *
 *
 * Utility that will report the frequency of updates to tracked data.
 *
 * ```js
 * import { UpdateFrequency } from 'ember-resources/util/fps';
 *
 * export default class Demo extends Component {
 *   @tracked someProp;
 *
 *   @use updateFrequency = UpdateFrequency(() => this.someProp);
 *
 *   <template>
 *     {{this.updateFrequency}}
 *   </template>
 * }
 * ```
 *
 * NOTE: the function passed to UpdateFrequency may not set tracked data.
 */
const UpdateFrequency = resourceFactory((ofWhat, updateInterval = 500) => {
  updateInterval ||= 500;
  let multiplier = 1000 / updateInterval;
  let framesSinceUpdate = 0;
  return resource(({
    on
  }) => {
    let value = cell(0);
    let interval = setInterval(() => {
      value.current = framesSinceUpdate * multiplier;
      framesSinceUpdate = 0;
    }, updateInterval);
    on.cleanup(() => clearInterval(interval));
    return () => {
      ofWhat();
      framesSinceUpdate++;
      return value.current;
    };
  });
});

export { FrameRate, UpdateFrequency };
//# sourceMappingURL=fps.js.map
