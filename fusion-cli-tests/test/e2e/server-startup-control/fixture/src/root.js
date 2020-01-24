// @noflow

import React from 'react';
import Router, {Route, Switch, Link} from 'fusion-plugin-react-router';
import Home from './home.js';

export default function Root() {
  return (
    <div>
      <Switch>
        <Route path={'/'} component={Home} />
      </Switch>
    </div>
  );
}
