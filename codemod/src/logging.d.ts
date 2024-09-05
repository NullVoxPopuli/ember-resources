export function processAssert(msg: string, condition: unknown): asserts condition;
export function assert(msg: string, condition: unknown): asserts condition;
export function warn(msg): void;
export function success(msg): void;
export function error(msg): void;
export function info(msg): void;
export function sep(): void;
