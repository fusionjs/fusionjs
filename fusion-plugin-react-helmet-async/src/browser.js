import React from 'react';
import {createPlugin} from 'fusion-core';
import {HelmetProvider} from 'react-helmet-async';

export default __BROWSER__ &&
  createPlugin({
    middleware: () => {
      return (ctx, next) => {
        ctx.element = (
          <HelmetProvider content={{}}>{ctx.element}</HelmetProvider>
        );
        return next();
      };
    },
  });
