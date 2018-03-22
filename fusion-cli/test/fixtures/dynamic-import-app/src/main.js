// @flow
import React from 'react';
import App from 'fusion-react';
import root from './root.js';

export default async function start() {
  const app = new App(root);
  return app;
}
