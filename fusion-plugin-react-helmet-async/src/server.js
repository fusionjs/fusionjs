import React from 'react';
import {createPlugin, dangerouslySetHTML} from 'fusion-core';
import {HelmetProvider} from 'react-helmet-async';

const keys = ['meta', 'link', 'style', 'base', 'noscript', 'script'];

export default __NODE__ &&
  createPlugin({
    middleware: () => {
      return async (ctx, next) => {
        if (!ctx.element) {
          return next();
        }
        const helmetContext = {};
        ctx.element = (
          <HelmetProvider context={helmetContext}>{ctx.element}</HelmetProvider>
        );
        await next();
        const {helmet} = helmetContext;
        ctx.template.title = helmet.title
          .toString()
          .replace('</title>', '')
          .replace(/^<title.*>/, '');
        keys.forEach(key => {
          ctx.template.head.push(dangerouslySetHTML(helmet[key].toString()));
        });
      };
    },
  });
