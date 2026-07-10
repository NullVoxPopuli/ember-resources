import { tracked } from '@glimmer/tracking';

import { resource } from 'ember-resources';

class Cell<T> {
  @tracked declare current: T;
}

function cell<T>(initialValue?: T) {
  const instance = new Cell<T>();

  if (initialValue) instance.current = initialValue;

  return instance;
}

export const overInvalidatingClock = resource(({ on }) => {
  const time = cell(new Date());

  const interval = setInterval(() => {
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
  const time = cell(new Date());

  const interval = setInterval(() => {
    time.current = new Date();
  }, 1_000);

  on.cleanup(() => clearInterval(interval));

  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  return () => formatter.format(time.current);
});
