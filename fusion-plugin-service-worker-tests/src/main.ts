// @flow
import App from 'fusion-react';
import Router from 'fusion-plugin-react-router';
import Styletron from 'fusion-plugin-styletron-react';
import {LoggerToken} from 'fusion-tokens';

import {swTemplate as swTemplateFunction} from 'fusion-cli/sw';
import SwPlugin, {
  SWRegisterToken,
  SWTemplateFunctionToken,
  SWOptionsToken,
} from 'fusion-plugin-service-worker';

import MockRedirectPlugin from './plugins/mock-redirect';
import MockErrorPlugin from './plugins/mock-server-error';

import root from './root.js';

const createMockLogger = () => ({
  log: () => createMockLogger(),
  error: () => createMockLogger(),
  warn: () => createMockLogger(),
  info: () => createMockLogger(),
  verbose: () => createMockLogger(),
  debug: () => createMockLogger(),
  silly: () => createMockLogger(),
});

export default () => {
  const app = new App(root);
  app.register(Styletron);
  app.register(Router);

  app.register(SwPlugin);
  if (__BROWSER__) {
    app.register(SWRegisterToken, true);
  }
  if (__NODE__) {
    app.register(LoggerToken, createMockLogger());
    app.register(SWTemplateFunctionToken, swTemplateFunction);
    const expiry = parseInt(process.env.EXPIRY, 0);
    if (expiry) {
      app.register(SWOptionsToken, {cacheDuration: expiry});
    }
    if (process.env.CACHE_BUSTING_PATTERNS) {
      app.register(SWOptionsToken, {
        // $FlowFixMe
        cacheBustingPatterns: [process.env.CACHE_BUSTING_PATTERNS],
      });
    }
    if (process.env.CACHEABLE_ROUTE_PATTERNS) {
      app.register(SWOptionsToken, {
        cacheableRoutePatterns: [
          // $FlowFixMe
          process.env.CACHEABLE_ROUTE_PATTERNS,
        ],
      });
    }
  }

  app.register(MockRedirectPlugin);
  app.register(MockErrorPlugin);

  return app;
};
