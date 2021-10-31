import { setApplication } from '@ember/test-helpers';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';

import Application from 'ember-app/app';
import config from 'ember-app/config/environment';

setApplication(Application.create(config.APP));

setup(QUnit.assert);

QUnit.config.testTimeout = 2000;

start();
