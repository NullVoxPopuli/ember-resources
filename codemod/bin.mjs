#!/usr/bin/env node

import { run } from './src/all.js';
import { sep, success } from './src/logging.js';

await run();

sep();
success(`✨ Done! ✨`);
