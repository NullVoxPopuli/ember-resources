import * as QUnit from 'qunit';

import { rest, setupWorker } from 'msw';
import ENV from 'test-app/config/environment';

let worker: ReturnType<typeof setupWorker>;

/**
 * Setup worker before any test begins so that we don't introduce
 * any potential instabilities due to "sometimes" making a test
 * run longer by lazily setting up the work for the first test
 * that uses `setupMSW`
 */
QUnit.begin(async () => {
  worker = setupWorker();

  /**
   * At this point we have no request handlers, but that's what
   * setupMSW is for
   */
  await worker.start({ quiet: ENV.isTestCli });
});

QUnit.done(async () => {
  worker.printHandlers();
  worker?.stop();
});

export async function setupMSW(
  hooks: NestedHooks,
  handlers: (args: { rest: typeof rest }) => Parameters<(typeof worker)['use']>
) {
  hooks.beforeEach(async function () {
    /**
     * Remove handlers that were maybe added during a previous a test.
     */
    worker.resetHandlers();

    /**
     * Install the handlers passed in from the test
     */
    worker.use(...handlers({ rest }));
  });

  hooks.afterEach(function () {
    /**
     * Ensure that we clean up after ourselves
     */
    worker?.resetHandlers();
  });
}
