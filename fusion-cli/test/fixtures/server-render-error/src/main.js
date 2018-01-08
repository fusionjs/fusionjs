import React from 'react';
import App from 'fusion-react';
import Router, {Route, Switch} from 'fusion-plugin-react-router';

import Home from './home.js';

export default () => {
  const app = new App(<Switch>
    <Route exact path="/" component={Home} />
  </Switch>);
  app.plugin(Router, {});
  return app;
};
