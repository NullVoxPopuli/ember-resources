import { cell,resource } from 'ember-resources';

export const Now = resource(({ on }) => {
  const now = cell(Date.now());

  const timer = setInterval(() => {
    now.set(Date.now());
  });

  on.cleanup(() => {
    clearInterval(timer);
  });

  return now;
});


<template>
  It is: <time>{{Now}}</time>

  It is: <time>{{Now.current}}</time>
</template>
