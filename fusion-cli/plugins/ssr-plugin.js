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

const CDN_URL_SET = Boolean(process.env.CDN_URL);

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

      let preloadHints = [];
      let criticalChunkScripts = [];

      let forceLegacyOnly = false;

      const browser = ctx.useragent.browser;

      /*
      Edge must get transpiled classes due to:
      - https://github.com/Microsoft/ChakraCore/issues/5030
      - https://github.com/Microsoft/ChakraCore/issues/4663
      - https://github.com/babel/babel/issues/8019
      Rather than transpile classes in the modern bundles, Edge should be forced on the slow path
      */
      if (browser.name === 'Edge') {
        forceLegacyOnly = true;
      }

      const isSafari =
        browser.name === 'Safari' || browser.name === 'Mobile Safari';

      /*
      Safari does not send credentials for same-origin module scripts.
      https://bugs.webkit.org/show_bug.cgi?id=171550

      Therefore, if no CDN is used and the app is behind auth, the requests will fail.
      In this case, fallback to legacy only
      */
      if (!CDN_URL_SET && isSafari) {
        forceLegacyOnly = true;
      }

      if (!forceLegacyOnly) {
        for (let url of modernUrls) {
          preloadHints.push(
            `<link rel="modulepreload" href="${url}" crossorigin="anonymous"/>`
          );
          criticalChunkScripts.push(
            `<script type="module" defer src="${url}" nonce="${
              ctx.nonce
            }" crossorigin="anonymous"></script>`
          );
        }
      }

      const isSafari10_1 = isSafari && browser.version.startsWith('10.1');

      // Safari 10.1 does not respect nomodule attributes
      if (forceLegacyOnly || !isSafari10_1) {
        for (let url of legacyUrls) {
          const nomoduleAttr = forceLegacyOnly ? '' : ' nomodule';
          const crossoriginAttr = url.startsWith(__webpack_public_path__)
            ? ''
            : ' crossorigin="anonymous"';
          criticalChunkScripts.push(
            `<script${nomoduleAttr} defer src="${url}" nonce="${
              ctx.nonce
            }"${crossoriginAttr}></script>`
          );
        }
      }

      return [
        '<!doctype html>',
        `<html${safeAttrs}>`,
        `<head>`,
        `<meta charset="utf-8" />`,
        `<title>${safeTitle}</title>`,
        `${preloadHints.join('')}${coreGlobals}${criticalChunkScripts.join(
          ''
        )}${safeHead}`,
        `</head>`,
        `<body${safeBodyAttrs}>${ctx.rendered}${safeBody}</body>`,
        '</html>',
      ].join('');
    };
  },
});

export {SSRBodyTemplate};
