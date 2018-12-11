// @noflow
import React from 'react';
import App from 'fusion-react';

import home from './home.js';

export default async function start() {
  const app = new App(home());
  return app;
}
