// @noflow

import React from 'react';
import App from 'fusion-react';

function Root () {
  const split = import('./split.js');
  const splitWithChild = import('./split-with-child.js');
  return (
    <div>
      <div data-testid="split">
        {JSON.stringify(split.__I18N_KEYS)}
      </div>
      <div data-testid="split-with-child">
        {JSON.stringify(splitWithChild.__I18N_KEYS)}
      </div>
    </div>
  );
}

export default async function start() {
  const app = new App(<Root />);
  return app;
}
