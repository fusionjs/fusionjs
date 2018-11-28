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
import {createPlugin, getEnv} from 'fusion-core';

import path from 'path';
import mount from 'koa-mount';
import serve from 'koa-static';

export default function(dir /*: string */) {
  /* eslint-disable-next-line */
  return createPlugin/*:: <AssetsDepsType, AssetsType> */(
    {
      middleware: () => {
        const {baseAssetPath, env} = getEnv();
        // setting defer here tells the `serve` middleware to `await next` first before
        // setting the response. This allows composition with user middleware
        return mount(
          baseAssetPath,
          serve(path.resolve(dir, `.fusion/dist/${env}/client`), {
            defer: true,
            setHeaders: res => {
              // $FlowFixMe
              if (!module.hot) {
                res.setHeader('Cache-Control', 'public, max-age=31536000');
              }
              res.setHeader('Timing-Allow-Origin', '*');
            },
          })
        );
      },
    }
  );
}
