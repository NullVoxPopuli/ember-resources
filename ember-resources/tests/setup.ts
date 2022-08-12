import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';

setup(QUnit.assert);

import.meta.glob('./**/*test.{js,ts}', { eager: true });

// QUnit.start();
