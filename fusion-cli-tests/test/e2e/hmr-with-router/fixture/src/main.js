// @noflow
import React from 'react';
import App from 'fusion-react';
import Router, {Route, Routes} from 'fusion-plugin-react-router';
import UniversalEvents, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import {FetchToken} from 'fusion-tokens';

import Home from './home.js';

export default async function start() {
  const app = new App(
    (
      <Routes>
        <Route caseSensitive={true} path="/" element={<Home />} />
      </Routes>
    )
  );
  app.register(Router);
  app.register(UniversalEventsToken, UniversalEvents);
  __BROWSER__ && app.register(FetchToken, fetch);
  return app;
}
