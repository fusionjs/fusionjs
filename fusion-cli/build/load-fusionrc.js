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
const chalk = require('chalk');

let loggedNotice = false;

module.exports = function validateConfig(
  dir /*: any */
) /*: {babel?: {plugins?: Array<any>, presets?: Array<any>}, assumeNoImportSideEffects?: boolean} */ {
  const configPath = path.join(dir, '.fusionrc.js');
  let config;
  if (fs.existsSync(configPath)) {
    // $FlowFixMe
    config = require(configPath);
    if (!isValid(config)) {
      throw new Error('.fusionrc.js is invalid');
    }
    if (!loggedNotice && config.babel) {
      console.log(chalk.dim('Using custom Babel config from .fusionrc.js'));
      console.warn(
        chalk.yellow(
          'Warning: custom Babel config is an',
          chalk.bold.underline('unstable API'),
          'and may be not be supported in future releases. Use at your own risk.'
        )
      );
      loggedNotice = true;
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
      ['babel', 'assumeNoImportSideEffects'].includes(key)
    )
  ) {
    throw new Error(`Invalid property in .fusionrc.js`);
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
      'assumeNoImportSideEffects must be true, false, or undefined in fusionrc.js babel config'
    );
  }

  return true;
}
