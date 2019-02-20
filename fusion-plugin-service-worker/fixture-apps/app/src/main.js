// @flow
import App from 'fusion-react';
import Router from 'fusion-plugin-react-router';
import Styletron from 'fusion-plugin-styletron-react';
// import {createToken} from 'fusion-core'

import {swTemplate as swTemplateFunction} from 'fusion-cli/sw';
import SwPlugin, {SWRegisterToken, SWTemplateFunctionToken} from 'fusion-plugin-service-worker';

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
  }

  return app;
};
