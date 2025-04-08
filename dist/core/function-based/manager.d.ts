import { Cache, InternalFunctionResourceConfig, ResourceFunction } from "./types.js";
import Owner from '@ember/owner';
/**
 * Note, a function-resource receives on object, hooks.
 *    We have to build that manually in this helper manager
 */
declare class FunctionResourceManager {
    protected owner: Owner;
    capabilities: any;
    constructor(owner: Owner);
    /**
     * Resources do not take args.
     * However, they can access tracked data
     */
    /**
     * Resources do not take args.
     * However, they can access tracked data
     */
    createHelper(config: InternalFunctionResourceConfig): {
        fn: ResourceFunction<unknown>;
        cache: any;
    };
    getValue({ cache }: {
        fn: ResourceFunction;
        cache: Cache;
    }): any;
    getDestroyable({ fn }: {
        fn: ResourceFunction;
    }): ResourceFunction;
}
declare const ResourceManagerFactory: (owner: Owner) => FunctionResourceManager;
export { ResourceManagerFactory };
