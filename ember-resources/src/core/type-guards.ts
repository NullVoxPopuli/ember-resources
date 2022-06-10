import { Resource } from "./resource";

export function isResourceClass(maybeClass: unknown): maybeClass is Resource {
  if (typeof maybeClass === 'object') {
    if (maybeClass === null) return false;

    if ('prototype' in maybeClass) {
      // TS doesn't believe in prototypes...
      return (maybeClass as any).prototype instanceof Resource;
    }
  }

  return false;
}
