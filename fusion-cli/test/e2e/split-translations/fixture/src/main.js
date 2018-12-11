// @noflow
import React from 'react';
import App from 'fusion-react';
import Router from 'fusion-plugin-react-router';
import UniversalEvents, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import I18n, {
  I18nToken,
  I18nLoaderToken,
  createI18nLoader,
} from 'fusion-plugin-i18n-react';
import {FetchToken} from 'fusion-tokens';
import Root from './root.js';

export default async function start() {
  const app = new App(<Root />);
  app.register(Router);
  app.register(UniversalEventsToken, UniversalEvents);
  __BROWSER__ && app.register(FetchToken, window.fetch);
  app.register(I18nToken, I18n);
  __NODE__ && app.register(I18nLoaderToken, createI18nLoader());
  return app;
}

// $FlowFixMe
if (__BROWSER__ && module.hot) {
  window.__addHotStatusHandler = handler => {
    // $FlowFixMe
    module.hot.addStatusHandler(handler);
  };
}
