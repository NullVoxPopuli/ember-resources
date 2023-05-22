import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { bundle } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, '../../ember-resources');
const packageJsonPath = path.join(packagePath, 'package.json');
const packageJson = JSON.parse((await fs.readFile(packageJsonPath)).toString());

await bundle(path.join(packagePath, 'dist/index.js'), path.join(packagePath, 'dist/index.bundled.js'));
