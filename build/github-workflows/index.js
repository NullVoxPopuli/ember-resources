import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse, stringify } from 'yaml';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetDir = path.join(__dirname, '../..', '.github/workflows');

async function build() {
  let ci = path.join(__dirname, 'workflows/ci.yaml');
  let info = await fs.readFile(ci, 'utf8');

  // let parsed = parse(info, { keepSourceTokens: false, merge: true });
  // let output = stringify(parsed, { directives: false });
  let parsed = yaml.load(info, { json: true });
  let output = yaml.dump(parsed, { noRefs: true, quotingType: `"` });

  // Remove anchors
  parsed = parse(output);
  Object.keys(parsed).forEach((key) => (key.startsWith('_') ? delete parsed[key] : 0));
  output = stringify(parsed, { directives: false });

  await fs.writeFile(path.join(targetDir, 'ci.yml'), output);
}

build();
