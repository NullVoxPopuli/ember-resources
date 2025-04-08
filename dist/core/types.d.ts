import { INTERNAL } from "./function-based/types.js";
import { Thunk } from "./types/thunk.js";
interface Cache<T = unknown> {
    _: T;
}
interface Helper {
}
interface Stage1DecoratorDescriptor {
    initializer: () => unknown;
}
type Stage1Decorator = (prototype: object, key: string | symbol, descriptor?: Stage1DecoratorDescriptor) => any;
interface ClassResourceConfig {
    thunk: Thunk;
    definition: unknown;
    type: 'class-based';
    [INTERNAL]: true;
}
export * from "./types/base.js";
export * from "./types/signature-args.js";
export * from "./types/thunk.js";
export { Cache, Helper, Stage1DecoratorDescriptor, Stage1Decorator, ClassResourceConfig };
