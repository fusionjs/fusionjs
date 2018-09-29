/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
/* global __webpack_public_path__ */

/*::
declare var __webpack_public_path__: string;

import type {
  Context,
  SSRBodyTemplate as SSRBodyTemplateService,
} from 'fusion-core';
*/

import {
  createPlugin,
  escape,
  consumeSanitizedHTML,
  CriticalChunkIdsToken,
  RoutePrefixToken,
} from 'fusion-core';

import {
  chunks,
  runtimeChunkId,
  initialChunkIds, // $FlowFixMe
} from '../build/loaders/chunk-manifest-loader.js!'; // eslint-disable-line

const SSRBodyTemplate = createPlugin({
  deps: {
    criticalChunkIds: CriticalChunkIdsToken.optional,
    routePrefix: RoutePrefixToken.optional,
  },
  provides: ({criticalChunkIds, routePrefix}) => {
    return ctx => {
      const {htmlAttrs, bodyAttrs, title, head, body} = ctx.template;
      const safeAttrs = Object.keys(htmlAttrs)
        .map(attrKey => {
          return ` ${escape(attrKey)}="${escape(htmlAttrs[attrKey])}"`;
        })
        .join('');

      const safeBodyAttrs = Object.keys(bodyAttrs)
        .map(attrKey => {
          return ` ${escape(attrKey)}="${escape(bodyAttrs[attrKey])}"`;
        })
        .join('');

      const safeTitle = escape(title);
      // $FlowFixMe
      const safeHead = head.map(consumeSanitizedHTML).join('');
      // $FlowFixMe
      const safeBody = body.map(consumeSanitizedHTML).join('');

      const coreGlobals = [
        `<script nonce="${ctx.nonce}">`,
        `window.performance && window.performance.mark && window.performance.mark('firstRenderStart');`,
        routePrefix && `__ROUTE_PREFIX__ = ${JSON.stringify(routePrefix)};`,
        `__FUSION_ASSET_PATH__ = ${JSON.stringify(__webpack_public_path__)};`, // consumed in src/entries/client-public-path.js
        `</script>`,
      ]
        .filter(Boolean)
        .join('');

      const legacyCriticalChunkIds = ctx.preloadChunks;
      const modernCriticalChunkIds = criticalChunkIds
        ? criticalChunkIds.from(ctx)
        : new Set();

      const allCriticalChunkIds = new Set([
        ...initialChunkIds,
        // For now, take union of both legacy and modern
        ...legacyCriticalChunkIds,
        ...modernCriticalChunkIds,
        // runtime chunk must be last script
        runtimeChunkId,
      ]);

      const criticalChunkScripts = Array.from(allCriticalChunkIds)
        .map(id => chunkScript(chunks.get(id)))
        .join('');

      return [
        '<!doctype html>',
        `<html${safeAttrs}>`,
        `<head>`,
        `<meta charset="utf-8" />`,
        `<title>${safeTitle}</title>`,
        `${coreGlobals}${criticalChunkScripts}${safeHead}`,
        `</head>`,
        `<body${safeBodyAttrs}>${ctx.rendered}${safeBody}</body>`,
        '</html>',
      ].join('');
    };
  },
});

export {SSRBodyTemplate};

function chunkScript(url) {
  // cross origin is needed to get meaningful errors in window.onerror
  const crossOrigin = url.startsWith('https://')
    ? ' crossorigin="anonymous"'
    : '';

  return `<script defer src="${url}"${crossOrigin}></script>`;
}
