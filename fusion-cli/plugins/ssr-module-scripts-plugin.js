/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
/* global __webpack_public_path__ */

import {
  createPlugin,
  escape,
  consumeSanitizedHTML,
  CriticalChunkIdsToken,
  RoutePrefixToken,
  getEnv,
} from 'fusion-core';

import {
  chunks,
  runtimeChunkIds,
  initialChunkIds, // $FlowFixMe
} from '__SECRET_CHUNK_MANIFEST_LOADER__!'; // eslint-disable-line

/*::
import type {SSRBodyTemplateDepsType, SSRBodyTemplateType} from './types.js';
declare var __webpack_public_path__: string;
*/

/* eslint-disable-next-line */
export const SSRModuleScriptsBodyTemplate = createPlugin/*:: <SSRBodyTemplateDepsType,SSRBodyTemplateType> */(
    {
      deps: {
        criticalChunkIds: CriticalChunkIdsToken.optional,
        routePrefix: RoutePrefixToken.optional,
      },
      provides: ({criticalChunkIds, routePrefix}) => {
        const {dangerouslyExposeSourceMaps} = getEnv();
        return (ctx) => {
          const {htmlAttrs, bodyAttrs, title, head, body} = ctx.template;
          const safeAttrs = Object.keys(htmlAttrs)
            .map((attrKey) => {
              return ` ${escape(attrKey)}="${escape(htmlAttrs[attrKey])}"`;
            })
            .join('');

          const safeBodyAttrs = Object.keys(bodyAttrs)
            .map((attrKey) => {
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
            `__FUSION_ASSET_PATH__ = ${JSON.stringify(
              __webpack_public_path__
            )};`, // consumed in src/entries/client-public-path.js
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

          const devNoModuleLegacyBrowserWarningScript =
            __DEV__ && legacyUrls.length === 0
              ? `
              <script nomodule defer nonce="${ctx.nonce}">
              document.body.innerHTML='<div style="padding:20vmin;font-family:sans-serif;font-size:16px;background:papayawhip">
<p>You are using a legacy browser but only the modern bundle has been built (legacy bundles are skipped by default when using <code style="display:inline">fusion dev</code>)
 or when using using <code style="display:inline">fusion build</code> with the --modernBuildOnly flag.</p>
<p>Please use a modern browser, <pre><code style="display:inline">fusion dev --forceLegacyBuild</code></pre> or
<pre><code style="display:inline">fusion build</code></pre> with no --modernBuildOnly flag to build the legacy bundle.</p>
<p>For more information, see the docs on <a href="https://github.com/fusionjs/fusion-cli/blob/master/docs/progressively-enhanced-bundles.md">progressively enhanced bundles</a>.</p>
</div>';
              </script>
              `
              : '';

          const criticalChunkScripts = [];
          const preloadHints = [];
          const crossoriginAttr = process.env.CDN_URL
            ? ' crossorigin="anonymous"'
            : '';

          for (let url of modernUrls) {
            if (!__DEV__ && dangerouslyExposeSourceMaps) {
              // Use -with-map.js bundles
              url = addWithMap(url);
            }
            preloadHints.push(
              `<link rel="modulepreload" href="${url}" nonce="${ctx.nonce}"${crossoriginAttr} as="script"/>`
            );
            criticalChunkScripts.push(
              `<script type="module" src="${url}" nonce="${ctx.nonce}"${crossoriginAttr}></script>`
            );
          }

          for (let url of legacyUrls) {
            if (!__DEV__ && dangerouslyExposeSourceMaps) {
              // Use -with-map.js bundles
              url = addWithMap(url);
            }
            criticalChunkScripts.push(
              `<script defer nomodule src="${url}" nonce="${ctx.nonce}"${crossoriginAttr}></script>`
            );
          }

          return [
            '<!doctype html>',
            `<html${safeAttrs}>`,
            `<head>`,
            `<meta charset="utf-8" />`,
            `<title>${safeTitle}</title>`,
            `${getSafariNoModuleSupportScript({nonce: ctx.nonce})}`,
            `${devNoModuleLegacyBrowserWarningScript}`,
            `${preloadHints.join('')}${coreGlobals}${criticalChunkScripts.join(
              ''
            )}${safeHead}`,
            `</head>`,
            `<body${safeBodyAttrs}>${ctx.rendered}${safeBody}</body>`,
            '</html>',
          ].join('');
        };
      },
    }
  );

function addWithMap(url) {
  if (url.endsWith('-with-map.js')) {
    return url;
  } else {
    return url.replace(/\.js$/, '-with-map.js');
  }
}

function getSafariNoModuleSupportScript({nonce} /*: { nonce: string } */) {
  return [
    `<script nomodule nonce="${nonce}">`,
    `(function() {`,
    `var check = document.createElement('script');`,
    `if (!('noModule' in check) && 'onbeforeload' in check) {`,
    `var support = false;`,
    `document.addEventListener('beforeload', function(e) {`,
    `if (e.target === check) {`,
    `support = true;`,
    `} else if (!e.target.hasAttribute('nomodule') || !support) {`,
    `return;`,
    `}`,
    `e.preventDefault();`,
    `}, true);`,
    `check.type = 'module';`,
    `check.src = '.';`,
    `document.head.appendChild(check);`,
    `check.remove();`,
    `}`,
    `}());`,
    `</script>`,
  ].join('');
}
