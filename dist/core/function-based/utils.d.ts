import { InternalFunctionResourceConfig } from "./types.js";
/**
 * This is what allows resource to be used withotu @use.
 * The caveat though is that a property must be accessed
 * on the return object.
 *
 * A resource not using use *must* be an object.
 */
declare function wrapForPlainUsage<Value>(context: object, setup: InternalFunctionResourceConfig<Value>): Value;
export { wrapForPlainUsage };
