//@flow
/* eslint-env node */

/*
This is where environment variables should be defined
*/

const assert = require('assert');

const rootDir = load('ROOT_DIR', '.');
const env = load('NODE_ENV', 'development');
if (!(env === 'development' || env === 'production')) {
  throw new Error(`Invalid NODE_ENV loaded: ${env}.`);
}
const prefix = load('ROUTE_PREFIX', '');
const assetPath = '/_static';
const cdnUrl = load('CDN_URL', '');
assert(!cdnUrl.endsWith('/'), 'ROUTE_PREFIX must not end with /');

module.exports = () => {
  return {
    rootDir,
    env,
    prefix,
    assetPath,
    cdnUrl,
  };
};

function load(key, value) {
  return process.env[key] || value;
}
