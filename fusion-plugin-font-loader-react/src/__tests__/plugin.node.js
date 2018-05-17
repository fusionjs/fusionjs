/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';

import App from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import {
  fonts as mockFonts,
  preloadDepth as mockPreloadDepth,
} from './fixtures/static/font-config';

import FontLoaderReactPlugin from '../index';
import {FontLoaderReactToken, FontLoaderReactConfigToken} from '../tokens';

tape('exported as expected', t => {
  t.ok(FontLoaderReactPlugin, 'plugin defined as expected');
  t.equal(typeof FontLoaderReactPlugin, 'object', 'plugin is an object');
  t.end();
});

tape('plugin - middleware modifies head as expected', t => {
  const mockConfig = {
    fonts: mockFonts,
    preloadDepth: mockPreloadDepth,
  };

  const app = new App('content', el => el);
  app.middleware(async (ctx, next) => {
    await next();
    t.true(ctx.template.head.length > 0, 'head was modified by plugin');
  });
  app.register(FontLoaderReactToken, FontLoaderReactPlugin);
  app.register(FontLoaderReactConfigToken, mockConfig);
  app.middleware((ctx, next) => {
    ctx.body = {
      head: [],
    };
    return next();
  });

  getSimulator(app).render('/');

  t.end();
});
