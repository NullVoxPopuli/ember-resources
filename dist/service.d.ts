import { Stage1DecoratorDescriptor } from "./core/types.js";
import Owner from '@ember/owner';
/**
 * <div class="callout note">
 *
 * This is not a core part of ember-resources, but demonstrates how services *are* an extension of resources.  This utility should be considered a prototype, but this utility is still under the broader library's SemVer policy.
 *
 * A consuming app will not pay for the bytes of this utility unless imported.
 *
 * </div>
 *
 * An alternative to Ember's built in `@service` decorator.
 *
 * This decorator takes a resource and ties the resource's lifeime to the app / owner.
 *
 * The reason a resource is required, as opposed to allowing "any class", is that a
 * resource already has implemented the concept of "teardown" or "cleanup",
 * and native classes do not have this concept.
 *
 * Example:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { resource } from 'ember-resources';
 * import { service } from 'ember-resources/service';
 *
 * class PlanetsAPI { ... }
 *
 * const Planets = resource(({ on, owner }) => {
 *   let api = new PlanetsAPI(owner); // for further injections
 *
 *   // on cleanup, we want to cancel any pending requests
 *   on.cleanup(() => api.abortAll());
 *
 *   return api;
 * });
 *
 * class Demo extends Component {
 *   @service(Planets) planets;
 * }
 * ```
 *
 * For Stage 1 decorators and typescript, you'll need to manually declare the type:
 * ```ts
 * class Demo extends Component {
 *   @service(Planets) declare planets: Planets;
 * }
 * ```
 */
declare function service(resource: unknown): (_prototype: object, key: string, descriptor?: Stage1DecoratorDescriptor) => void;
interface RegisterOptions {
    /**
     * The original service to replace.
     */
    original: unknown;
    /**
     * The replacement service to use.
     */
    replacement: unknown;
}
/**
 *
 */
declare function serviceOverride(owner: Owner, { original, replacement }: RegisterOptions): void;
export { service, serviceOverride };
