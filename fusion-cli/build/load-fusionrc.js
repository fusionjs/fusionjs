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
export type FusionRC = {
  babel?: {plugins?: Array<any>, presets?: Array<any>},
  splitChunks?: any,
  assumeNoImportSideEffects?: boolean,
  experimentalCompile?: boolean,
  experimentalTransformTest?: (modulePath: string, defaults: TransformResult) => TransformResult,
  experimentalBundleTest?: (modulePath: string, defaults: BundleResult) => BundleResult,
  nodeBuiltins?: {[string]: any},
  jest?: {transformIgnorePatterns?: Array<string>},
  zopfli?: boolean,
  gzip?: boolean,
  brotli?:boolean,
};
*/

module.exports = function validateConfig(
  dir /*: string */,
  silent /*: boolean */ = false
) /*: FusionRC */ {
  const configPath = path.join(dir, '.fusionrc.js');
  let config;
  if (fs.existsSync(configPath)) {
    // $FlowFixMe
    config = require(configPath);
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
        'assumeNoImportSideEffects',
        'experimentalCompile',
        'experimentalTransformTest',
        'experimentalBundleTest',
        'nodeBuiltins',
        'jest',
        'brotli',
        'zopfli', // TODO: Remove redundant zopfli option
        'gzip',
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
      config.assumeNoImportSideEffects === false ||
      config.assumeNoImportSideEffects === true ||
      config.assumeNoImportSideEffects === void 0
    )
  ) {
    throw new Error(
      'assumeNoImportSideEffects must be true, false, or undefined in fusionrc.js config'
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
  return true;
}
