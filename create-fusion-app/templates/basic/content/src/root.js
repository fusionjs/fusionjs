// @flow
import React from 'react';

import {Route, Switch} from 'fusion-plugin-react-router';

import Home from './pages/home.js';
import PageNotFound from './pages/pageNotFound.js';
import Styles from './pages/styles.js';

const root = (
  <Switch>
    <Route exact path="/" component={Home} />
    <Route exact path="/styles" component={Styles} />
    <Route component={PageNotFound} />
  </Switch>
);
export default root;
