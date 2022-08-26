import { destroy } from '@ember/destroyable';
/**
 * A utility Resource that will only destroy itself once
 * all consumers of the Resource have been destroyed.
 *
 * For example, when used on a service, multiple components
 * may access a WebSocket and upon initial access, the WebSocket
 * is setup, but it is not torn down until the last accessor is
 * turn down.
 */
export function Ref(callback: () => unknown) {
  let revision = 0;
  return resource((hooks) => {

    return () => {};
  });
}
