/* eslint-env node */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

module.exports = function validateConfig(dir) {
  const configPath = path.join(dir, '.fusionrc.js');
  let config;
  if (fs.existsSync(configPath)) {
    config = require(configPath);
    if (!isValid(config)) {
      throw new Error('.fusionrc.js is invalid');
    }
    console.log(chalk.dim('Using custom Babel config from .fusionrc.js'));
    console.warn(
      chalk.yellow(
        'Warning: custom Babel config is an',
        chalk.bold.underline('unstable API'),
        'and may be not be supported in future releases. Use at your own risk.'
      )
    );
  } else {
    config = {};
  }
  return config;
};

function isValid(config) {
  return (
    typeof config === 'object' &&
    config !== null &&
    Object.keys(config).every(el => ['babel'].includes(el)) &&
    config.babel &&
    Object.keys(config.babel).every(el => ['plugins', 'presets'].includes(el))
  );
}
