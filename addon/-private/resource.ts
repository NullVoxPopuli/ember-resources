import { setOwner } from '@ember/application';

import type { ArgsWrapper } from './types';

export class LifecycleResource<T extends ArgsWrapper> {
  constructor(owner: unknown, protected args: T) {
    setOwner(this, owner);
  }

  protected declare setup: () => void;
  protected declare update: () => void;
  protected declare teardown: () => void;
}

