import { tracked } from '@glimmer/tracking';

import { Resource, resource } from 'ember-resources';

class Cell<T> {
  @tracked declare current: T;
}

function cell<T>(initialValue?: T) {
  let instance = new Cell<T>();

  if (initialValue) instance.current = initialValue;

  return instance;
}

export class Calculator extends Resource {
  prop = 3;

  double(num: number) {
    return num * 2;
  }
}

export class Doubler extends Resource<{ positional: [number] }> {
  @tracked value?: number;

  modify([input]: [number]) {
    this.value = input * 2;
  }
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
