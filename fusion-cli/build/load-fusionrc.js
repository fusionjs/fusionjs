/* eslint-env node */

const fs = require('fs');
const path = require('path');

module.exports = function validateConfig(dir) {
  const configPath = path.join(dir, '.fusionrc.js');
  let config;
  if (fs.existsSync(configPath)) {
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
  return (
    typeof config === 'object' &&
    Object.keys(config).every(el => ['babel'].includes(el)) &&
    config.babel &&
    Object.keys(config.babel).every(el => ['plugins', 'presets'].includes(el))
  );
}
