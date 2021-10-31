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
        optimizeConstEnums: true,
      },
    ],
    [resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
    resolve('@babel/plugin-proposal-class-properties'),
    resolve('@embroider/addon-dev/template-colocation-plugin'),
  ],
};
