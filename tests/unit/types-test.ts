import { Resource } from 'ember-resources';

import type { Named } from 'ember-resources';

interface Issue108Args {
  id: number;
}

// https://github.com/NullVoxPopuli/ember-resources/issues/108
export class Issues108<Args extends Named<Issue108Args>> extends Resource<Args> {}
