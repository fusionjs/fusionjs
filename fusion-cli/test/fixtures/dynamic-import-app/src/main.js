// @flow
import React from 'react';
import App from 'fusion-react';
import Router from 'fusion-plugin-react-router';
import UniversalEvents, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import {FetchToken} from 'fusion-tokens';
import Root from './root.js';

export default async function start() {
  const app = new App(<Root />);
  app.register(Router);
  app.register(UniversalEventsToken, UniversalEvents);
  __BROWSER__ && app.register(FetchToken, window.fetch);
  return app;
}
