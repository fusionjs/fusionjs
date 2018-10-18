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
  runtimeChunkIds,
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
        `__NONCE__ = ${JSON.stringify(ctx.nonce)}`, // consumed in src/entries/client-public-path.js
        `</script>`,
      ]
        .filter(Boolean)
        .join('');

      const tokenCriticalChunkIds = criticalChunkIds
        ? criticalChunkIds.from(ctx)
        : new Set();

      const allCriticalChunkIds = new Set([
        ...initialChunkIds,
        // For now, take union of both ctx and token
        ...ctx.preloadChunks,
        ...tokenCriticalChunkIds,
        // runtime chunk must be last script
        ...runtimeChunkIds,
      ]);

      const legacyUrls = [];
      const modernUrls = [];
      for (let chunkId of allCriticalChunkIds) {
        const url = chunks.get(chunkId);
        if (url.includes('client-legacy')) {
          legacyUrls.push(url);
        } else {
          modernUrls.push(url);
        }
      }

      const criticalChunkScripts = getLoaderScript(ctx, {
        legacyUrls,
        modernUrls,
      });

      const modulePreloadHints = modernUrls
        .map(url => modulePreloadHint(url))
        .join('');

      return [
        '<!doctype html>',
        `<html${safeAttrs}>`,
        `<head>`,
        `<meta charset="utf-8" />`,
        `<title>${safeTitle}</title>`,
        modulePreloadHints,
        `${coreGlobals}${criticalChunkScripts}${safeHead}`,
        `</head>`,
        `<body${safeBodyAttrs}>${ctx.rendered}${safeBody}</body>`,
        '</html>',
      ].join('');
    };
  },
});

export {SSRBodyTemplate};

function modulePreloadHint(url) {
  const crossOrigin = url.startsWith('https://')
    ? ' crossorigin="anonymous"'
    : '';
  return `<link rel="modulepreload"${crossOrigin} href="${url}" />`;
}

/**
Safari 10.1 supports modules but not `nomodule` attribute.
*/
function getLoaderScript(ctx, {legacyUrls, modernUrls}) {
  return `
  <script nomodule nonce="${ctx.nonce}">window.__NOMODULE__ = true;</script>
  <script nonce="${ctx.nonce}">(window.__NOMODULE__ ? ${JSON.stringify(
    legacyUrls
  )} : ${JSON.stringify(modernUrls)}).forEach(function(src) {
    var script = document.createElement('script');
    script.src = src;
    script.setAttribute("nonce", ${JSON.stringify(ctx.nonce)});
    if (!window.__NOMODULE__) {
      script.type = "module";
    } else {
      script.defer = true;
    }
    if (script.src.indexOf(window.location.origin + '/') !== 0) {
      script.crossorigin = "anonymous";
    }
    document.head.appendChild(script);
  });</script>
  `;
}
