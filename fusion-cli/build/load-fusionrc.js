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

import type {
  WebpackOptions
} from "webpack";

type BundleResult =  'universal' | 'browser-only';
type TransformResult = 'all' | 'spec' | 'none';
export type FusionRC = {
  babel?: {plugins?: Array<any>, presets?: Array<any>, exclude?: mixed},
  assumeNoImportSideEffects?: boolean,
  experimentalSideEffectsTest?: (modulePath: string, defaults: boolean) => boolean,
  experimentalCompile?: boolean,
  experimentalTransformTest?: (modulePath: string, defaults: TransformResult) => TransformResult,
  experimentalBundleTest?: (modulePath: string, defaults: BundleResult) => BundleResult,
  nodeBuiltins?: {[string]: any},
  jest?: {transformIgnorePatterns?: Array<string>},
  zopfli?: boolean,
  brotli?: boolean,
  svgo?: boolean,
  overrideWebpackConfig:? (any) => any
};
*/

module.exports = function validateConfig(dir /*: string */) /*: FusionRC */ {
  const configPath = path.join(dir, '.fusionrc.js');
  let config;
  if (fs.existsSync(configPath)) {
    // $FlowFixMe
    config = require(configPath);
    if (!isValid(config)) {
      throw new Error('.fusionrc.js is invalid');
    }
  } else {
    config = {};
  }
  return config;
};

function isValid(config) {
  if (!(typeof config === 'object' && config !== null)) {
    throw new Error('.fusionrc.js must export an object');
  }

  if (
    !Object.keys(config).every(key =>
      [
        'babel',
        'assumeNoImportSideEffects',
        'experimentalSideEffectsTest',
        'experimentalCompile',
        'experimentalTransformTest',
        'experimentalBundleTest',
        'nodeBuiltins',
        'jest',
        'brotli',
        'zopfli',
        'svgo',
        'overrideWebpackConfig',
      ].includes(key)
    )
  ) {
    throw new Error(`Invalid property in .fusionrc.js`);
  }

  if (config.assumeNoImportSideEffects && config.experimentalSideEffectsTest) {
    throw new Error(
      `Cannot use both assumeNoImportSideEffects and experimentalSideEffectsTest in .fusionrc.js`
    );
  }

  if (config.assumeNoImportSideEffects) {
    console.log(
      'WARNING: assumeNoImportSideEffects is deprecated. Use experimentalSideEffectsTest instead.'
    );
    config.experimentalSideEffectsTest = (file, defaults) => false;
    delete config.assumeNoImportSideEffects;
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
    console.log(
      'WARNING: experimentalCompile is deprecated. Use experimentalTransformTest instead.'
    );
    config.experimentalTransformTest = (file, defaults) => {
      return 'all';
    };
    delete config.experimentalCompile;
  }

  if (
    config.babel &&
    !Object.keys(config.babel).every(el =>
      ['plugins', 'presets', 'exclude'].includes(el)
    )
  ) {
    throw new Error(
      `Only "plugins", "presets" and "exclude" are supported in fusionrc.js babel config`
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
      'assumeNoImportSideEffects must be true, false, or undefined in fusionrc.js babel config'
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
