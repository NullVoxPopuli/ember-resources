import { tracked } from '@glimmer/tracking';

import { resource } from 'ember-resources';

class Cell<T> {
  @tracked declare current: T;
}

function cell<T>(initialValue?: T) {
  let instance = new Cell<T>();

  if (initialValue) instance.current = initialValue;

  return instance;
}

export const overInvalidatingClock = resource(({ on }) => {
  let time = cell(new Date());

  let interval = setInterval(() => {
    time.current = new Date();
  }, 1_000);

  on.cleanup(() => clearInterval(interval));

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).format(time.current);
});

export const clock = resource(({ on }) => {
  let time = cell(new Date());

  let interval = setInterval(() => {
    time.current = new Date();
  }, 1_000);

  on.cleanup(() => clearInterval(interval));

  let formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  return () => formatter.format(time.current);
});
