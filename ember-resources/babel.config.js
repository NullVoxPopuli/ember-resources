import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const resolve = require.resolve;

export default {
  plugins: [
    [
      resolve('@babel/plugin-transform-typescript'),
      {
        allowDeclareFields: true,
        onlyRemoveTypeImports: true,
        // Default enums are IIFEs
        optimizeConstEnums: true,
      },
    ],
    [
      resolve('@babel/plugin-proposal-decorators'),
      {
        // The stage 1 implementation
        legacy: true,
      },
    ],
    [
      resolve('@babel/plugin-proposal-class-properties'),
      {
        // Only support browsers that also support class properties...
        // If all addons do this, it greatly reduces shipped JS
        loose: true,
      },
    ],
    resolve('@embroider/addon-dev/template-colocation-plugin'),
  ],
};
