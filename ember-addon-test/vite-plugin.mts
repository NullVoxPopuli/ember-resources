import { type Plugin, type PluginOption } from 'vite';
import checker from 'vite-plugin-checker';
import redirect from 'vite-plugin-redirect';
// import babel from 'vite-plugin-babel';

import { join, dirname } from 'node:path';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);

const emberSource = dirname(dirname(require.resolve('ember-source')));

const nm = (modulePath: string) => join(__dirname, 'node_modules', modulePath);
const ember = (modulePath: string) => join(emberSource, 'dist', 'packages', modulePath);
const eDep = (modulePath: string) => join(emberSource, 'dist', 'dependencies', modulePath);

interface Options {
  /**
    * Enable typescript checking
  * defaults to true.
    */
  ts?: boolean;
}

const qunitCss = nm('qunit/qunit/qunit.css');
const selfHtml = (join(__dirname, 'index.html'));

export const plugins = (options: Options = {}): PluginOption[] => {
  let enableTS = options.ts ?? true;
  let result: PluginOption[] = [];

  // babel(),
  if (enableTS) {
    result.push(
      checker({ typescript: true }),
    )
  }

  result.push(...[
    redirect({
      '/qunit.css': qunitCss,
    }),
    emberAddon(),
  ]);

  return result;
}

function emberAddon(options: Options = {}): Plugin {
  return {
    name: 'ember-addon-test-support',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' && req.method === 'GET') {

          let stream = fs.createReadStream(selfHtml);
          stream.pipe(res);
          stream.on('end', () => {
            stream.destroy();
          });

          return;
        }

        next();
      });
    },
    config: () => ({
      optimizeDeps: {
        include: [
          emberSource,
          // path.join(__dirname, '**/*'),
          // process.cwd(),
        ]
      },
      resolve: {
        /**
          * NOTE: all of these things need to be converted to v2 addons.
          */
        alias: {
          // Test Dependencies
          'ember-qunit': nm('ember-qunit/addon-test-support'),
          '@ember/test-helpers': nm('@ember/test-helpers/addon-test-support/@ember/test-helpers'),



          // Glimmer
          '@glimmer/env': join(__dirname, 'replacements', 'glimmer-env.js'),
          // '@glimmer/tracking/primitives/cache': ember('@glimmer/tracking/primitives/cache.js'),
          '@glimmer/tracking': ember('@glimmer/tracking'),

          '@glimmer/destroyable': eDep('@glimmer/destroyable.js'),
          '@glimmer/encoder': eDep('@glimmer/encoder.js'),
          '@glimmer/global-context': eDep('@glimmer/global-context.js'),
          '@glimmer/low-level': eDep('@glimmer/low-level.js'),
          '@glimmer/manager': eDep('@glimmer/manager.js'),
          '@glimmer/node': eDep('@glimmer/node.js'),
          '@glimmer/opcode-compiler': eDep('@glimmer/opcode-compiler.js'),
          '@glimmer/owner': eDep('@glimmer/owner.js'),
          '@glimmer/program': eDep('@glimmer/program.js'),
          '@glimmer/reference': eDep('@glimmer/reference.js'),
          '@glimmer/runtime': eDep('@glimmer/runtime.js'),
          '@glimmer/util': eDep('@glimmer/util.js'),
          '@glimmer/validator': eDep('@glimmer/validator.js'),
          '@glimmer/vm': eDep('@glimmer/vm.js'),
          '@glimmer/wire-format': eDep('@glimmer/wire-format.js'),

          // Ember
          '@ember/-internals': ember('@ember/-internals'),
          '@ember/application': ember('@ember/application'),
          '@ember/array': ember('@ember/array'),
          '@ember/canary-features': ember('@ember/canary-features'),
          '@ember/component': ember('@ember/component'),
          '@ember/controller': ember('@ember/controller'),
          '@ember/debug': ember('@ember/debug'),
          '@ember/destroyable': ember('@ember/destroyable'),
          '@ember/engine': ember('@ember/engine'),
          '@ember/enumerable': ember('@ember/enumerable'),
          '@ember/error': ember('@ember/error'),
          '@ember/helper': ember('@ember/helper'),
          '@ember/instrumentation': ember('@ember/instrumentation'),
          '@ember/modifier': ember('@ember/modifier'),
          '@ember/object': ember('@ember/object'),
          '@ember/polyfills': ember('@ember/polyfills'),
          '@ember/routing': ember('@ember/routing'),
          '@ember/runloop': ember('@ember/runloop'),
          '@ember/service': ember('@ember/service'),
          '@ember/string': ember('@ember/string'),
          '@ember/template': ember('@ember/template'),
          '@ember/template-compilation': ember('@ember/template-compilation'),
          '@ember/test': ember('@ember/test'),
          '@ember/utils': ember('@ember/utils'),
          '@ember/version': ember('@ember/version'),
          'ember/version': ember('ember/version.js'),
          'ember': ember('ember/index.js'),
          'ember-testing': ember('ember-testing'),

          // 3rd Parties
          'backburner': eDep('backburner.js'),
          'route-recognizer': eDep('route-recognizer.js'),
          'router_js': eDep('router_js.js'),
          'rsvp': eDep('rsvp.js'),
          '@simple-dom/document': eDep('@simple-dom/document'),

          'qunit': nm('qunit/qunit/qunit.js'),
          'qunit-dom': nm('qunit-dom/dist/addon-test-support'),
        }
      },
    }),
  }
}
