// @noflow
import React from 'react';
import App from 'fusion-react';
import {split} from 'fusion-react';

const Client = split({
  defer: true,
  load: () => (__BROWSER__ ? import('./home.js') : Promise.resolve({ default: () => null })),
  LoadingComponent: () => null,
  ErrorComponent: function ErrorComponent() {
    return <div>Error</div>;
  },
});

export default async function start() {
  const app = new App(<Client />);
  return app;
}
