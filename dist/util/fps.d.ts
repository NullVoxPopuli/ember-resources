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
declare const FrameRate: string;
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
declare const UpdateFrequency: ((ofWhat: () => unknown, updateInterval?: any) => number) | (() => number);
export { FrameRate, UpdateFrequency };
