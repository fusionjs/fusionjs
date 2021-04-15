/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */
/*::
import type {AssetsDepsType, AssetsType} from './types.js';
*/
import {createPlugin, getEnv, RouteTagsToken} from 'fusion-core';

// $FlowFixMe
import {chunks} from '../build/loaders/chunk-manifest-loader.js!'; // eslint-disable-line

import path from 'path';
import mount from 'koa-mount';
import serve from 'koa-static';

export default function(dir /*: string */) {
  /* eslint-disable-next-line */
  return createPlugin/*:: <AssetsDepsType, AssetsType> */(
    {
      deps: {
        RouteTags: RouteTagsToken,
      },
      middleware: ({RouteTags}) => {
        const {baseAssetPath, env, dangerouslyExposeSourceMaps} = getEnv();
        const denyList = new Set();
        for (let chunk of chunks.values()) {
          if (!__DEV__ && !dangerouslyExposeSourceMaps) {
            // Add sourcemaps to static asset denylist
            denyList.add(`/${path.basename(chunk)}.map`);
          }
        }

        const assetMiddleware = serve(
          path.resolve(dir, `.fusion/dist/${env}/client`),
          {
            // setting defer here tells the `serve` middleware to `await next` first before
            // setting the response. This allows composition with user middleware
            defer: true,
            setHeaders: res => {
              if (!__DEV__) {
                res.setHeader('Cache-Control', 'public, max-age=31536000');
              }
              res.setHeader('Timing-Allow-Origin', '*');
            },
          }
        );

        return mount(baseAssetPath, (ctx, next) => {
          RouteTags.from(ctx).name = 'static_asset';
          if (denyList.has(ctx.url)) {
            return next();
          }
          return assetMiddleware(ctx, next);
        });
      },
    }
  );
}
