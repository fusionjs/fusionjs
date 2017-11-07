//@flow
/* eslint-env node */

/*
This is where environment variables should be defined
*/

const assert = require('assert');
const {SingletonPlugin} = require('fusion-core');

const rootDir = load('ROOT_DIR', '.');
const env = load('NODE_ENV', 'development');
const prefix = load('ROUTE_PREFIX', '');
const assetPath = load('FRAMEWORK_STATIC_ASSET_PATH', '/_static');
assert(!prefix.endsWith('/'), 'ROUTE_PREFIX must not end with /');

module.exports = function() {
  /*::
  rootDir: String
  env: 'development'|'production'
  prefix: String
  assetPath: String
  */
  return new SingletonPlugin({
    Service: class EnvVarPlugin {
      constructor() {
        this.rootDir = rootDir;
        this.env = env;
        this.prefix = prefix;
        this.assetPath = assetPath;
      }
    },
  });
};

function load(key, value) {
  return process.env[key] || value;
}
