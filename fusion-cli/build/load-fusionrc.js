/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

/*::

type BundleResult =  'universal' | 'browser-only';
type TransformResult = 'all' | 'spec' | 'none';
export type BuildStats = {
  command?: 'dev' | 'build',
  buildTime: number,
  mode: 'development' | 'production',
  path: string,
  target: string,
  isBuildCacheEnabled: boolean,
  isBuildCachePersistent: boolean,
  isIncrementalBuild: boolean,
  minify: boolean,
  skipSourceMaps: boolean,
  watch: boolean,
  version: string,
  buildToolVersion: 'webpack v5',
};
export type FusionRC = {
  configPath?: string,
  babel?: {plugins?: Array<any>, presets?: Array<any>},
  splitChunks?: any,
  modernBuildOnly?: boolean,
  assumeNoImportSideEffects?: boolean | Array<string>,
  defaultImportSideEffects?: boolean | Array<string>,
  experimentalCompile?: boolean,
  experimentalTransformTest?: (modulePath: string, defaults: TransformResult) => TransformResult,
  experimentalBundleTest?: (modulePath: string, defaults: BundleResult) => BundleResult,
  nodeBuiltins?: {[string]: any},
  jest?: {transformIgnorePatterns?: Array<string>},
  zopfli?: boolean,
  gzip?: boolean,
  brotli?: boolean,
  onBuildEnd?: (stats: BuildStats) => void,
  disableBuildCache?: boolean,
};
*/

module.exports = function validateConfig(
  dir /*: string */,
  silent /*: boolean */ = false
) /*: FusionRC */ {
  const configPath = path.join(dir, '.fusionrc.js');
  let config;
  if (fs.existsSync(configPath)) {
    config = {
      // $FlowFixMe
      ...require(configPath)
    };

    // Store path to config, needed to invalidate build cache
    Object.defineProperty(config, 'configPath', {
      value: configPath
    });
    if (!isValid(config, silent)) {
      throw new Error('.fusionrc.js is invalid');
    }
  } else {
    config = {};
  }
  return config;
};

function isValid(config, silent) {
  if (!(typeof config === 'object' && config !== null)) {
    throw new Error('.fusionrc.js must export an object');
  }

  if (
    !Object.keys(config).every(key =>
      [
        'babel',
        'splitChunks',
        'modernBuildOnly',
        'defaultImportSideEffects',
        'assumeNoImportSideEffects',
        'experimentalCompile',
        'experimentalTransformTest',
        'experimentalBundleTest',
        'nodeBuiltins',
        'jest',
        'brotli',
        'zopfli', // TODO: Remove redundant zopfli option
        'gzip',
        'onBuildEnd',
        'disableBuildCache',
      ].includes(key)
    )
  ) {
    if (config.experimentalSideEffectsTest) {
      throw new Error(
        `experimentalSideEffectsTest has been removed. Use assumeNoImportSideEffects instead.`
      );
    }
    throw new Error(`Invalid property in .fusionrc.js`);
  }

  if (config.experimentalCompile && config.experimentalTransformTest) {
    throw new Error(
      `Cannot use both experimentalCompile and experimentalTransformTest in .fusionrc.js`
    );
  }

  if (config.experimentalCompile && config.experimentalBundleTest) {
    throw new Error(
      `Cannot use both experimentalCompile and experimentalBundleTest in .fusionrc.js`
    );
  }

  if (config.experimentalCompile) {
    if (!silent) {
      console.log(
        'WARNING: experimentalCompile is deprecated. Use experimentalTransformTest instead.'
      );
    }

    config.experimentalTransformTest = (file, defaults) => {
      return 'all';
    };
    delete config.experimentalCompile;
  }

  if (
    config.babel &&
    !Object.keys(config.babel).every(el => ['plugins', 'presets'].includes(el))
  ) {
    throw new Error(
      `Only "plugins" and "presets" are supported in fusionrc.js babel config`
    );
  }

  if (
    !(
      config.assumeNoImportSideEffects === void 0 ||
      config.assumeNoImportSideEffects === true ||
      config.assumeNoImportSideEffects === false ||
      (Array.isArray(config.assumeNoImportSideEffects) &&
        config.assumeNoImportSideEffects.every(item => typeof item === 'string'))
    )
  ) {
    throw new Error(
      'assumeNoImportSideEffects must be true, false, or an array of strings in fusionrc.js'
    );
  }

  if (
    !(
      config.zopfli === false ||
      config.zopfli === true ||
      config.zopfli === void 0
    )
  ) {
    throw new Error('zopfli must be true, false, or undefined in fusionrc.js');
  }

  if (config.zopfli === false || config.zopfli === true) {
    console.warn('`zopfli` option has been deprecated. Use `gzip` instead');
  }

  if (
    !(config.gzip === false || config.gzip === true || config.gzip === void 0)
  ) {
    throw new Error('gzip must be true, false, or undefined in fusionrc.js');
  }

  if (
    !(
      config.brotli === false ||
      config.brotli === true ||
      config.brotli === void 0
    )
  ) {
    throw new Error('brotli must be true, false, or undefined in fusionrc.js');
  }

  if (
    !(
      config.defaultImportSideEffects === void 0 ||
      config.defaultImportSideEffects === true ||
      config.defaultImportSideEffects === false ||
      (Array.isArray(config.defaultImportSideEffects) &&
        config.defaultImportSideEffects.every(item => typeof item === 'string'))
    )
  ) {
    throw new Error(
      'defaultImportSideEffects must be true, false, or an array of strings in fusionrc.js'
    );
  }

  if (
    config.defaultImportSideEffects !== void 0 &&
    config.assumeNoImportSideEffects !== void 0
  ) {
    throw new Error(
      `Cannot use both defaultImportSideEffects and assumeNoImportSideEffects in .fusionrc.js`
    );
  }

  if (config.onBuildEnd !== void 0 && typeof config.onBuildEnd !== 'function') {
    throw new Error('onBuildEnd must be function');
  }

  if (
    !(
      config.disableBuildCache === false ||
      config.disableBuildCache === true ||
      config.disableBuildCache === void 0
    )
  ) {
    throw new Error('disableBuildCache must be true, false, or undefined in fusionrc.js');
  }

  return true;
}
