import { EmptyObject, GetOrElse } from "./base.js";
type ArgsFor<S> = S extends {
    Named?: object;
    Positional?: unknown[];
} ? {
    Named: GetOrElse<S, 'Named', EmptyObject>;
    Positional: GetOrElse<S, 'Positional', []>;
} : S extends {
    named?: object;
    positional?: unknown[];
} ? {
    Named: GetOrElse<S, 'named', EmptyObject>;
    Positional: GetOrElse<S, 'positional', []>;
} : {
    Named: EmptyObject;
    Positional: [];
};
type ElementFor<S> = 'Element' extends keyof S ? S['Element'] extends Element ? S['Element'] : Element : Element;
/**
 * Converts a variety of types to the expanded arguments type
 * that aligns with the 'Args' portion of the 'Signature' types
 * from ember's helpers, modifiers, components, etc
 */
type ExpandArgs<T> = T extends any[] ? ArgsFor<{
    Positional: T;
}> : T extends any ? ArgsFor<T> : never;
type Positional<T> = ExpandArgs<T>['Positional'];
type Named<T> = ExpandArgs<T>['Named'];
export { ArgsFor, ElementFor, ExpandArgs, Positional, Named };
