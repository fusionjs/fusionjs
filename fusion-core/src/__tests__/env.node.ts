/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/* eslint-env node */
import {loadEnv} from '../get-env';

test('loadEnv defaults', () => {
  process.env.NODE_ENV = '';

  const env = loadEnv()();
  expect(env).toEqual({
    rootDir: '.',
    env: 'development',
    prefix: '',
    assetPath: '/_static',
    baseAssetPath: '/_static',
    cdnUrl: '',
    webpackPublicPath: '/_static',
    dangerouslyExposeSourceMaps: false,
  });
});

test('loadEnv overrides', () => {
  process.env.ROOT_DIR = 'test_root_dir';
  process.env.NODE_ENV = 'production';
  process.env.ROUTE_PREFIX = 'test_route_prefix';
  process.env.FRAMEWORK_STATIC_ASSET_PATH = '/test_framework';
  process.env.CDN_URL = 'test_cdn_url';
  process.env.DANGEROUSLY_EXPOSE_SOURCE_MAPS = 'true';

  const env = loadEnv()();
  expect(env).toEqual({
    rootDir: 'test_root_dir',
    env: 'production',
    prefix: 'test_route_prefix',
    assetPath: 'test_route_prefix/test_framework',
    baseAssetPath: '/test_framework',
    cdnUrl: 'test_cdn_url',
    webpackPublicPath: 'test_cdn_url',
    dangerouslyExposeSourceMaps: true,
  });

  process.env.ROOT_DIR = '';
  process.env.NODE_ENV = '';
  process.env.ROUTE_PREFIX = '';
  process.env.FRAMEWORK_STATIC_ASSET_PATH = '';
  process.env.CDN_URL = '';
});

test('loadEnv validation', () => {
  process.env.NODE_ENV = 'LOL';
  expect(loadEnv).toThrow(/Invalid NODE_ENV loaded/);
  process.env.NODE_ENV = '';

  process.env.ROUTE_PREFIX = 'test/';
  expect(loadEnv).toThrow(/ROUTE_PREFIX must not end with /);
  process.env.ROUTE_PREFIX = '';

  process.env.FRAMEWORK_STATIC_ASSET_PATH = 'test/';
  expect(loadEnv).toThrow(/FRAMEWORK_STATIC_ASSET_PATH must not end with /);
  process.env.FRAMEWORK_STATIC_ASSET_PATH = '';

  process.env.CDN_URL = 'test/';
  expect(loadEnv).toThrow(/CDN_URL must not end with /);
  process.env.CDN_URL = '';
});
