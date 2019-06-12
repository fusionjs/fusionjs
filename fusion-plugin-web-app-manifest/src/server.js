/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import {createPlugin, html} from 'fusion-core';
import type {FusionPlugin} from 'fusion-core';
import {WebAppManifestToken} from './tokens';
import type {DepsType} from './types';

const plugin =
  __NODE__ &&
  createPlugin<DepsType, void>({
    deps: {
      manifest: WebAppManifestToken,
    },
    middleware({manifest}) {
      return (ctx, next) => {
        if (ctx.element) {
          ctx.template.head.push(
            html`
              <link rel="manifest" href="/manifest.json" />
            `
          );
        } else if (ctx.method === 'GET' && ctx.path === '/manifest.json') {
          ctx.body = manifest;
        }
        return next();
      };
    },
  });

export default ((plugin: any): FusionPlugin<DepsType, void>);
