import { cell, resource, resourceFactory } from 'ember-resources';

export function Clock() {
  let time = cell(new Date());

  return resource(({ on }) => {
    let interval = setInterval(() => (time.current = new Date()), 1000);

    on.cleanup(() => clearInterval(interval));

    // this works at runtime but TS/Glint can't figure it out
    // return time;

    // The above is a shorthand for this
    return () => time.current as Date & { toHTML(): string };
    // this cast is a Glint Hack
    // because Glint things Date can't be rendered...
  });
}

// template-usage compatibility
// (if we only invoke fthe resource function from JS, we don't need this)
resourceFactory(Clock);

// Globals-resolver compatibility
export default Clock;
