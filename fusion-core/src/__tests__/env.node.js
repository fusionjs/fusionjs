/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
import tape from 'tape-cup';
import {loadEnv} from '../get-env.js';

tape('loadEnv defaults', t => {
  const env = loadEnv()();
  t.deepEqual(env, {
    rootDir: '.',
    env: 'development',
    prefix: '',
    assetPath: '/_static',
    baseAssetPath: '/_static',
    cdnUrl: '',
    webpackPublicPath: '/_static',
  });
  t.end();
});

tape('loadEnv overrides', t => {
  process.env.ROOT_DIR = 'test_root_dir';
  process.env.NODE_ENV = 'production';
  process.env.ROUTE_PREFIX = 'test_route_prefix';
  process.env.FRAMEWORK_STATIC_ASSET_PATH = '/test_framework';
  process.env.CDN_URL = 'test_cdn_url';

  const env = loadEnv()();
  t.deepEqual(env, {
    rootDir: 'test_root_dir',
    env: 'production',
    prefix: 'test_route_prefix',
    assetPath: 'test_route_prefix/test_framework',
    baseAssetPath: '/test_framework',
    cdnUrl: 'test_cdn_url',
    webpackPublicPath: 'test_cdn_url',
  });

  process.env.ROOT_DIR = '';
  process.env.NODE_ENV = '';
  process.env.ROUTE_PREFIX = '';
  process.env.FRAMEWORK_STATIC_ASSET_PATH = '';
  process.env.CDN_URL = '';
  t.end();
});

tape('loadEnv validation', t => {
  process.env.NODE_ENV = 'LOL';
  t.throws(loadEnv, /Invalid NODE_ENV loaded/);
  process.env.NODE_ENV = '';

  process.env.ROUTE_PREFIX = 'test/';
  t.throws(loadEnv, /ROUTE_PREFIX must not end with /);
  process.env.ROUTE_PREFIX = '';

  process.env.FRAMEWORK_STATIC_ASSET_PATH = 'test/';
  t.throws(loadEnv, /FRAMEWORK_STATIC_ASSET_PATH must not end with /);
  process.env.FRAMEWORK_STATIC_ASSET_PATH = '';

  process.env.CDN_URL = 'test/';
  t.throws(loadEnv, /CDN_URL must not end with /);
  process.env.CDN_URL = '';
  t.end();
});
