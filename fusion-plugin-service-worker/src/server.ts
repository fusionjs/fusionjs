/* global */

import url from 'url';
import {createPlugin} from 'fusion-core';
import {LoggerToken} from 'fusion-tokens';
import type {FusionPlugin} from 'fusion-core';

import {SWTemplateFunctionToken, SWOptionsToken} from './tokens';

function invokeTemplateFn(templateFn, resources) {
  return templateFn(resources);
}

function hasSameHostName(url1, url2) {
  return url.parse(String(url1)).hostname === url.parse(String(url2)).hostname;
}

export default __NODE__ &&
  (createPlugin({
    deps: {
      logger: LoggerToken,
      templateFn: SWTemplateFunctionToken,
      options: SWOptionsToken.optional,
    },
    middleware: ({
      logger,
      templateFn,
      options: {
        cacheBustingPatterns,
        cacheableRoutePatterns,
        cacheDuration,
      } = {} as any,
    }) => {
      return async (ctx, next) => {
        if (__NODE__) {
          if (ctx.method === 'GET' && ctx.url === '/sw.js') {
            const chunkUrls = Array.from(ctx.chunkUrlMap).map((value) =>
              value[1].get('es5')
            );
            try {
              ctx.type = 'text/javascript';
              ctx.set('Cache-Control', 'max-age=0');
              ctx.body = invokeTemplateFn(templateFn, {
                // TODO(#24): also include images etc.
                cacheableResourcePaths: chunkUrls,
                // cannot precache from different domain
                precachePaths: chunkUrls.filter((url) =>
                  hasSameHostName(url, ctx.url)
                ),
                cacheBustingPatternStrings: cacheBustingPatterns
                  ? cacheBustingPatterns.map((regex) => String(regex))
                  : [],
                cacheableRoutePatternStrings: cacheableRoutePatterns
                  ? cacheableRoutePatterns.map((regex) => String(regex))
                  : [],
                cacheDuration,
              });
            } catch (err) {
              ctx.status = 500;
              ctx.body = {error: err.message};
              logger.error('Error in Service Worker endpoint:', err);
            }
          }
          return next();
        }
      };
    },
  }) as any as FusionPlugin<{}, void>);
