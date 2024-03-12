import { cell, resource, resourceFactory } from 'ember-resources';

const locale = 'en-US';
const formatter = new Intl.DateTimeFormat(locale, {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
});

export function Clock() {
  let time = cell(new Date());

  return resource(({ on }) => {
    let interval = setInterval(() => time.current = new Date(), 1000);

    on.cleanup(() => clearInterval(interval));

    return () => formatter.format(time.current);
  });
}

// template-usage compatibility
// (if we only invoke fthe resource function from JS, we don't need this)
resourceFactory(Clock);

// Globals-resolver compatibility
export default Clock;
