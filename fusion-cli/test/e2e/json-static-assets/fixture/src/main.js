// @noflow
import React from 'react';
import App from 'fusion-react';

import Home from './home.js';

export default async function start() {
  const app = new App(<Home />);
  return app;
}
