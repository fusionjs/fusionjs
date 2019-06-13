/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createPlugin} from '../create-plugin';
import {escape, consumeSanitizedHTML} from '../sanitization';
import type {
  Context,
  SSRDecider as SSRDeciderService,
  SSRBodyTemplate as SSRBodyTemplateService,
} from '../types.js';

const botRegex = /(bot|crawler|spider)/i;
const SSRDecider = createPlugin<{}, SSRDeciderService>({
  provides: () => {
    return ctx => {
      // If the request has one of these extensions, we assume it's not something that requires server-side rendering of virtual dom
      // TODO(#46): this check should probably look at the asset manifest to ensure asset 404s are handled correctly
      if (ctx.path.match(/\.(js|js\.map|gif|jpg|png|pdf|json|svg)$/))
        return false;

      // Bots don't always include the accept header.
      if (ctx.headers['user-agent']) {
        const agent = ctx.headers['user-agent'];
        if (botRegex.test(agent) && ctx.method === 'GET') {
          return true;
        }
      }

      // The Accept header is a good proxy for whether SSR should happen
      // Requesting an HTML page via the browser url bar generates a request with `text/html` in its Accept headers
      // XHR/fetch requests do not have `text/html` in the Accept headers
      if (!ctx.headers.accept) return false;
      if (!ctx.headers.accept.includes('text/html')) return false;
      return true;
    };
  },
});
export {SSRDecider};

export default function createSSRPlugin({
  element,
  ssrDecider,
  ssrBodyTemplate,
}: {
  element: any,
  ssrDecider: SSRDeciderService,
  ssrBodyTemplate?: SSRBodyTemplateService,
}) {
  return async function ssrPlugin(ctx: Context, next: () => Promise<void>) {
    if (!ssrDecider(ctx)) return next();

    const template = {
      htmlAttrs: {},
      bodyAttrs: {},
      title: '',
      head: [],
      body: [],
    };
    ctx.element = element;
    ctx.rendered = '';
    ctx.template = template;
    ctx.type = 'text/html';

    await next();

    // Allow someone to override the ssr by setting ctx.body
    // This is especially useful for things like ctx.redirect
    if (ctx.body && ctx.respond !== false) {
      return;
    }

    if (ssrBodyTemplate) {
      ctx.body = ssrBodyTemplate(ctx);
    } else {
      ctx.body = legacySSRBodyTemplate(ctx);
    }
  };
}

function legacySSRBodyTemplate(ctx) {
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
  const safeHead = head.map(consumeSanitizedHTML).join('');
  const safeBody = body.map(consumeSanitizedHTML).join('');

  const preloadHintLinks = getPreloadHintLinks(ctx);
  const coreGlobals = getCoreGlobals(ctx);
  const chunkScripts = getChunkScripts(ctx);
  const bundleSplittingBootstrap = [
    preloadHintLinks,
    coreGlobals,
    chunkScripts,
  ].join('');

  return [
    '<!doctype html>',
    `<html${safeAttrs}>`,
    `<head>`,
    `<meta charset="utf-8" />`,
    `<title>${safeTitle}</title>`,
    `${bundleSplittingBootstrap}${safeHead}`,
    `</head>`,
    `<body${safeBodyAttrs}>${ctx.rendered}${safeBody}</body>`,
    '</html>',
  ].join('');
}

function getCoreGlobals(ctx) {
  const {webpackPublicPath, nonce} = ctx;

  return [
    `<script nonce="${nonce}">`,
    `window.performance && window.performance.mark && window.performance.mark('firstRenderStart');`,
    `__ROUTE_PREFIX__ = ${JSON.stringify(ctx.prefix)};`, // consumed by ./client
    `__WEBPACK_PUBLIC_PATH__ = ${JSON.stringify(webpackPublicPath)};`, // consumed by fusion-clientries/client-entry
    `</script>`,
  ].join('');
}

function getUrls({chunkUrlMap, webpackPublicPath}, chunks) {
  // cross origin is needed to get meaningful errors in window.onerror
  const isCrossOrigin = webpackPublicPath.startsWith('http');
  const crossOriginAttribute = isCrossOrigin ? ' crossorigin="anonymous"' : '';
  return [...new Set(chunks)].map(id => {
    let url = chunkUrlMap.get(id).get('es5');
    if (webpackPublicPath.endsWith('/')) {
      url = webpackPublicPath + url;
    } else {
      url = webpackPublicPath + '/' + url;
    }
    return {url, crossOriginAttribute};
  });
}

function getChunkScripts(ctx) {
  const sync = getUrls(ctx, ctx.syncChunks).map(
    ({url, crossOriginAttribute}) => {
      return `<script nonce="${ctx.nonce}" defer${crossOriginAttribute} src="${url}"></script>`;
    }
  );
  const preloaded = getUrls(
    ctx,
    ctx.preloadChunks.filter(item => !ctx.syncChunks.includes(item))
  ).map(({url, crossOriginAttribute}) => {
    return `<script nonce="${ctx.nonce}" defer${crossOriginAttribute} src="${url}"></script>`;
  });
  return [...preloaded, ...sync].join('');
}

function getPreloadHintLinks(ctx) {
  const chunks = [...ctx.preloadChunks, ...ctx.syncChunks];
  const hints = getUrls(ctx, chunks).map(({url, crossOriginAttribute}) => {
    return `<link rel="preload"${crossOriginAttribute} href="${url}" nonce="${ctx.nonce}" as="script" />`;
  });
  return hints.join('');
}
