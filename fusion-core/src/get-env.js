/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */
/* eslint-env node */
import assert from 'assert';

function load(key, value) {
  return process.env[key] || value;
}

export function loadEnv() {
  const rootDir = load('ROOT_DIR', '.');
  const env = load('NODE_ENV', 'development');
  if (!(env === 'development' || env === 'production' || env === 'test')) {
    throw new Error(`Invalid NODE_ENV loaded: ${env}.`);
  }
  const prefix = load('ROUTE_PREFIX', '');
  assert(!prefix.endsWith('/'), 'ROUTE_PREFIX must not end with /');
  const baseAssetPath = load('FRAMEWORK_STATIC_ASSET_PATH', `/_static`);
  assert(
    !baseAssetPath.endsWith('/'),
    'FRAMEWORK_STATIC_ASSET_PATH must not end with /'
  );
  const cdnUrl = load('CDN_URL', '');
  assert(!cdnUrl.endsWith('/'), 'CDN_URL must not end with /');
  const dangerouslyExposeSourceMaps = load(
    'DANGEROUSLY_EXPOSE_SOURCE_MAPS',
    'false'
  );

  const assetPath = `${prefix}${baseAssetPath}`;
  return function loadEnv() {
    return {
      rootDir,
      env,
      prefix,
      assetPath,
      baseAssetPath,
      cdnUrl,
      webpackPublicPath: cdnUrl || assetPath,
      dangerouslyExposeSourceMaps: dangerouslyExposeSourceMaps === 'true',
    };
  };
}

export default __BROWSER__ ? () => {} : loadEnv();
