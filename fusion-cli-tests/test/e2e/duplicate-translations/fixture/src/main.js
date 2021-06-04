// @noflow

import React from 'react';
import App from 'fusion-react';

function Root() {
  const main = import('./component.js');
  const withChild = import('./component-with-children.js');
  return (
    <div>
      <div data-testid="main">{JSON.stringify(main.__I18N_KEYS)}</div>
      <div data-testid="with-children">
        {JSON.stringify(withChild.__I18N_KEYS)}
      </div>
    </div>
  );
}

export default async function start() {
  const app = new App(<Root />);
  return app;
}
