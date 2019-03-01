// @flow
import React from 'react';
import App from 'fusion-react';
import Root from './root.js';

export default async function start() {
  const app = new App(<Root />);
  return app;
}
