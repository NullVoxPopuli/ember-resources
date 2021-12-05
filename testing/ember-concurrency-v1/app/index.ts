import { dropTask } from 'ember-concurrency-decorators';
import Service from '@ember/service';
import { taskFor } from 'ember-concurrency-ts';
import { tracked } from '@glimmer/tracking';
import { useTask } from 'ember-resources';

export default class extends Service {
  @tracked foodId = 'pizza';

  foodResource = useTask(this, taskFor(this.loadFood), () => [this.foodId]);

  @dropTask
  async loadFood() {
    let food = await Promise.resolve();
    return food;
  }
}
