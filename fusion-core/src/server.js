/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env node */
import path from 'path';
import {compose} from './plugin/index.js';
import {escape, consumeSanitizedHTML} from './sanitization';
import Timing, {now} from './timing';

export default function() {
  const Koa = require('koa');

  return class ServerApp {
    constructor(element, render) {
      this._app = new Koa();
      const ssrPlugin = async (ctx, next) => {
        if (!isSSR(ctx)) return next();

        const template = {
          htmlAttrs: {},
          title: '',
          head: [],
          body: [],
        };
        ctx.element = element;
        ctx.rendered = '';
        ctx.body = template;
        ctx.type = 'text/html';
        if (!ctx.chunkUrlMap) ctx.chunkUrlMap = new Map();
        if (!ctx.syncChunks) ctx.syncChunks = [];
        if (!ctx.preloadChunks) ctx.preloadChunks = [];

        await next();

        if (ctx.body !== template) return; // this can happen if you hit an endpoint from the url bar

        const {htmlAttrs, title, head, body} = ctx.body;
        const safeAttrs = Object.keys(htmlAttrs).map(attrKey => {
          return ` ${escape(attrKey)}="${escape(htmlAttrs[attrKey])}"`;
        });
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

        const chunkPreloaderScript = getChunkPreloaderScript(ctx);

        ctx.body = [
          '<!doctype html>',
          `<html${safeAttrs}>`,
          `<head>`,
          `<title>${safeTitle}</title>`,
          `${bundleSplittingBootstrap}${safeHead}`,
          `</head>`,
          `<body>${ctx.rendered}${safeBody}${chunkPreloaderScript}</body>`,
          '</html>',
        ].join('');
      };
      const rendererPlugin = async (ctx, next) => {
        const timing = Timing.of(ctx);
        timing.downstream.resolve(now() - timing.start);

        if (ctx.element) {
          const renderStart = now();
          ctx.rendered = await render(ctx.element);
          timing.render.resolve(now() - renderStart);
        }

        const upstreamStart = now();
        await next();
        timing.upstream.resolve(now() - upstreamStart);
      };
      this.plugins = [Timing, ssrPlugin, rendererPlugin];
    }
    onerror(err) {
      return this._app.onerror(err);
    }
    plugin(plugin, dependencies) {
      const service = plugin(dependencies);
      this.plugins.splice(-1, 0, service);
      return service;
    }
    callback() {
      this._app.use(compose(this.plugins));
      return this._app.callback();
    }
  };
}

function isSSR(ctx) {
  // If the request has one of these extensions, we assume it's not something that requires server-side rendering of virtual dom
  // TODO(#46): this check should probably look at the asset manifest to ensure asset 404s are handled correctly
  if (ctx.path.match(/\.js$/)) return false;
  // The Accept header is a good proxy for whether SSR should happen
  // Requesting an HTML page via the browser url bar generates a request with `text/html` in its Accept headers
  // XHR/fetch requests do not have `text/html` in the Accept headers
  if (!ctx.headers.accept) return false;
  if (!ctx.headers.accept.includes('text/html')) return false;
  //TODO(#45): Investigate alternatives to checking accept header
  return true;
}

function getCoreGlobals(ctx) {
  const {chunkUrlMap, webpackPublicPath, nonce} = ctx;

  const chunkManifest = {};
  Array.from(chunkUrlMap.entries()).forEach(([id, variant]) => {
    if (variant) {
      const filepath = /*variant.get(ctx.esVersion) || */ variant.get('es5');
      chunkManifest[id] = path.basename(filepath);
    }
  }, {});
  const serializedManifest = JSON.stringify(chunkManifest);
  const hasManifest = Object.keys(chunkManifest).length > 0;
  const manifest = hasManifest ? `__MANIFEST__ = ${serializedManifest};` : ''; // consumed by webpack

  return [
    `<script nonce="${nonce}">`,
    `__ROUTE_PREFIX__ = ${JSON.stringify(ctx.prefix)};`, // consumed by ./client
    `__WEBPACK_PUBLIC_PATH__ = ${JSON.stringify(webpackPublicPath)};`, // consumed by fusion-clientries/client-entry
    manifest,
    `</script>`,
  ].join('');
}

function getUrls({chunkUrlMap, webpackPublicPath}, chunks) {
  return chunks.map(id => {
    let url = chunkUrlMap.get(id).get('es5');
    if (webpackPublicPath.endsWith('/')) {
      url = webpackPublicPath + url;
    } else {
      url = webpackPublicPath + '/' + url;
    }
    return {id, url};
  });
}

function getChunkScripts(ctx) {
  const webpackPublicPath = ctx.webpackPublicPath || '';
  // cross origin is needed to get meaningful errors in window.onerror
  const crossOrigin = webpackPublicPath.startsWith('https://')
    ? ' crossorigin="anonymous"'
    : '';
  const sync = getUrls(ctx, ctx.syncChunks).map(({url}) => {
    return `<script defer${crossOrigin} src="${url}"></script>`;
  });
  const preloaded = getUrls(ctx, ctx.preloadChunks).map(({id, url}) => {
    return `<script defer${crossOrigin} src="${url}" data-webpack-preload="${id}"></script>`;
  });
  return [...sync, ...preloaded].join('');
}

function getPreloadHintLinks(ctx) {
  const chunks = [...ctx.syncChunks, ...ctx.preloadChunks];
  const hints = getUrls(ctx, chunks).map(({url}) => {
    return `<link rel="preload" href="${url}" as="script" />`;
  });
  return hints.join('');
}

function getChunkPreloaderScript({nonce = '', preloadChunks}) {
  // NOTE: the event listeners below are not needed if inline onerror event handlers are allowed by CSP.
  // However, this is disallowed currently.
  return trim(`
  <script nonce="${nonce}">
  (function(){
    __PRELOADED_CHUNKS__ = ${JSON.stringify(preloadChunks)};
    function onError(e) {
      var el = e.target;
      if (el.nodeName !== "SCRIPT") return;
      var val = el.getAttribute("data-webpack-preload");
      if (val === null) return;
      var id = parseInt(val, 10);
      if (__HANDLE_ERROR) return __HANDLE_ERROR(id);
      if (!__UNHANDLED_ERRORS__) __UNHANDLED_ERRORS__ = [];
      __UNHANDLED_ERRORS__.push(id);
    }
    addEventListener("error", onError, true);
    addEventListener("load", function() {
        removeEventListener("error", onError);
    });
  })();
  </script>`);
}

function trim(str) {
  return str.replace(/^\s+/gm, '');
}
