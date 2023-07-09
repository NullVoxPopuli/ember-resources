import { cell, resource, resourceFactory } from '../index';

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
export const FrameRate = resource(({ on }) => {
  let value = cell(0);
  let startTime = new Date().getTime();
  let frame: number;

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
export const UpdateFrequency = resourceFactory((ofWhat: () => unknown, updateInterval = 500) => {
  updateInterval ||= 500;

  let multiplier = 1000 / updateInterval;
  let framesSinceUpdate = 0;

  return resource(({ on }) => {
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
