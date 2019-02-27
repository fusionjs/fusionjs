// @flow
import App from 'fusion-react';
import Router from 'fusion-plugin-react-router';
import Styletron from 'fusion-plugin-styletron-react';
// import {createToken} from 'fusion-core'

import {swTemplate as swTemplateFunction} from 'fusion-cli/sw';
import SwPlugin, {SWRegisterToken, SWTemplateFunctionToken, SWMaxCacheDurationMs} from '../../../dist';

import MockRedirectPlugin from './plugins/mock-redirect';
import MockErrorPlugin from './plugins/mock-server-error';

import root from './root.js';

export default () => {
  const app = new App(root);
  app.register(Styletron);
  app.register(Router);

  app.register(SwPlugin);
  if (__BROWSER__) {
    app.register(SWRegisterToken, true);
  }
  if (__NODE__) {
    app.register(SWTemplateFunctionToken, swTemplateFunction);
    const expiry = parseInt(process.env.EXPIRY, 0);
    if (expiry) {
      app.register(SWMaxCacheDurationMs, expiry);
    }
  }

  app.register(MockRedirectPlugin);
  app.register(MockErrorPlugin);

  return app;
};
