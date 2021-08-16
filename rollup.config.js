import path from 'path';
import replace from 'rollup-plugin-replace';
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';
import {terser} from 'rollup-plugin-terser';

const packageDir = path.resolve(__dirname);
const resolve = p => path.resolve(packageDir, p);

const entryFile = resolve('src/index.ts');
const pkg = require(resolve(`package.json`));

const outputConfigs = {
  esm: {
    file: resolve(`dist/plugin.esm.js`),
    format: 'es',
  },
  cjs: {
    file: resolve(`dist/plugin.cjs.js`),
    format: 'cjs',
  },
};

// ts检查优化
let hasTypesChecked = false;

const defaultFormats = ['esm', 'cjs'];
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split('-');
const packageFormats = inlineFormats || defaultFormats;

const packageConfigs = [];
if (!process.env.PROD_ONLY) {
  packageFormats.forEach(format => {
    if (!outputConfigs[format]) return;
    packageConfigs.push(createConfig(format, outputConfigs[format]));
  });
}

// 为生产环境创建rollup配置
if (process.env.NODE_ENV === 'production') {
  packageFormats.forEach(format => {
    if (!outputConfigs[format]) return;
    if (format === 'cjs') {
      packageConfigs.push(createCjsProductionConfig(format));
    }
  });
}

function createConfig(format, output, plugins = []) {
  if (!output) {
    console.log(require('chalk').yellow(`invalid format: "${format}"`));
    process.exit(1);
  }

  output.exports = 'auto';
  output.sourcemap = !!process.env.SOURCE_MAP;
  output.externalLiveBindings = false;

  const shouldEmitDeclaration = process.env.TYPES != null && !hasTypesChecked;

  const tsPlugin = typescript({
    check: process.env.NODE_ENV === 'production' && !hasTypesChecked,
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
    objectHashIgnoreUnknownHack: true,
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: output.sourcemap,
        declaration: shouldEmitDeclaration,
        declarationMap: shouldEmitDeclaration,
      },
      exclude: ['**/__tests__'],
    },
  });
  hasTypesChecked = true;

  let external = [];
  if (format === 'esm' || format === 'cjs') {
    external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
  } else {
    const evaDependencies = Array.from(Object.keys(pkg.dependencies || {})).filter(dep => dep.startsWith('@eva'));
    external = ['pixi.js', ...evaDependencies];
  }

  return {
    input: entryFile,
    output: output,
    external,
    plugins: [
      json({preferConst: true}),
      replace({
        __TEST__: false,
        __DEV__: process.env.NODE_ENV === 'development',
      }),
      tsPlugin,
      ...plugins,
    ],
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg);
      }
    },
    treeshake: {
      moduleSideEffects: false,
    },
  };
}

function createCjsProductionConfig(format) {
  return createConfig(
    format,
    {
      file: resolve(`dist/plugin.${format}.prod.js`),
      format: outputConfigs[format].format,
    },
    [
      terser({
        toplevel: true,
        mangle: true,
        compress: true,
      }),
    ],
  );
}

export default packageConfigs;
