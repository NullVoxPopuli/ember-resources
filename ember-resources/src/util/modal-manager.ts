import { tracked } from '@glimmer/tracking';

interface ValuedResult<TValue> {
  reason: 'confirmed' | 'rejected';
  value: TValue;
}

interface CancelledResult {
  reason: 'cancelled';
}

type Result<TValue> = ValuedResult<TValue> | CancelledResult;

interface Controller {
  open: () => void;
  close: () => void;
}

const noop = () => {
  return;
};

/**
 * A utility to manage modal dialog boxes. It provides an isOpen tracked
 * property that can be used in templates to show/hide a modal dialog.
 *
 * This utility helps the code logic by offering a promise that will result in
 * the conclusion of the modal dialog. It also allows you to provide the dialog
 * component a simple manager interface that it can use to confirm, cancel, and
 * even reject based on user input. That result can then be used for control
 * flow by that initiator or even passed around as a promise as needed.
 *
 * @example
 * ```ts
 * import Component from '@glimmer/component';
 * import { ModalManager } from 'ember-resources/utils/modal-manager';
 *
 * class Demo extends Component {
 *   manager = new ModalManager();
 *   openAndManageModal = async () => {
 *     let { reason, value } = await this.manager.open();
 *     if (reason !== 'confirmed') return;
 *     doSomethingWith(value);
 *   }
 * }
 * ```
 *
 * ```hbs
 * <button type="button" {{on "click" this.openAndManageModal}}></button>
 * {{#if this.manager.isOpen}}
 *   <MyModal @manager={{this.manager}} />
 * {{/if}}
 * ```
 */
export class ModalManager<TValue = undefined> {
  #openModal: () => void = noop;
  #closeModal: () => void = noop;
  #resolve: (result: Result<TValue>) => void = noop;
  #reject: (error: Error) => void = noop;

  @tracked _isOpen = false;

  get isOpen() {
    return this._isOpen;
  }

  open = () => {
    return new Promise<Result<TValue>>((resolve, reject) => {
      this._isOpen = true;
      this.#resolve = resolve;
      this.#reject = reject;
      this.#openModal();
    }).finally(() => {
      this.#closeModal();
      this._isOpen = true;
    });
  };

  cancel = () => {
    this.#resolve({ reason: 'cancelled' });
  };

  confirm = (value: TValue) => {
    this.#resolve({ reason: 'confirmed', value });
  };

  reject = (value: TValue) => {
    this.#resolve({ reason: 'rejected', value });
  };

  error = (error: Error) => {
    this.#reject(error);
  };

  delegateTo(controller: Controller) {
    this.#openModal = () => controller.open();
    this.#closeModal = () => controller.close();
  }

  static withDelegate(factory: (manager: ModalManager) => Controller) {
    let manager = new ModalManager();
    let controller = factory(manager);

    manager.delegateTo(controller);

    return manager;
  }
}
