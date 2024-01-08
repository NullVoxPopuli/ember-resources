import { module, test } from 'qunit';
// Should have no deprecations
import 'ember-resources';

// These would throw an error, because they're deprecated
// import 'ember-resources/util/debounce';
// import 'ember-resources/util/ember-concurrency';
// import 'ember-resources/util/fps';
// import 'ember-resources/util/function';
// import 'ember-resources/util/helper';
// import 'ember-resources/util/keep-latest';
// import 'ember-resources/util/map';
// import 'ember-resources/util/remote-data';

module('Placeholder test', function () {
  test('everything is fine', function (assert) {
    assert.ok(true);
  });
});
