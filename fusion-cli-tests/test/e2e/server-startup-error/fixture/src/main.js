// @noflow
import React from 'react';
import App from 'fusion-react';
import {FetchToken} from 'fusion-tokens';
import UniversalEventsPlugin, {
  UniversalEventsToken,
} from 'fusion-plugin-universal-events';
import Router from 'fusion-plugin-react-router';

import Home from './home.js';

export default () => {
  const app = new App(
    (
      <Routes>
        <Route caseSensitive={true} path="/" element={<Home />} />
      </Routes>
    )
  );
  app.register(Router);
  __BROWSER__ && app.register(FetchToken, window.fetch);
  app.register(UniversalEventsToken, UniversalEventsPlugin);
  return app;
};
