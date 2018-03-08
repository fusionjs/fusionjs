/* eslint-env node */
import assert from 'assert';

export default (__BROWSER__ ? () => {} : loadEnv());

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
    };
  };
}
