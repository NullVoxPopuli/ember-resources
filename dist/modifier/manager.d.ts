import { FunctionBasedModifierDefinition } from "./index.js";
import { ArgsFor, ElementFor } from "../core/types.js";
interface State<S> {
    instance: FunctionBasedModifierDefinition<S>;
    helper: unknown;
}
interface CreatedState<S> extends State<S> {
    element: null;
}
interface InstalledState<S> extends State<S> {
    element: ElementFor<S>;
}
declare class FunctionBasedModifierManager<S> {
    capabilities: any;
    createModifier(instance: FunctionBasedModifierDefinition<S>): CreatedState<S>;
    installModifier(createdState: CreatedState<S>, element: ElementFor<S>, args: ArgsFor<S>): void;
    updateModifier(state: InstalledState<S>, args: ArgsFor<S>): void;
    destroyModifier(state: InstalledState<S>): void;
}
export { FunctionBasedModifierManager as default };
