import React from 'react';

import {Router, Route, Switch} from 'fusion-plugin-react-router';

import Header from './components/header.js';
import Home from './pages/home.js';
import PageNotFound from './pages/pageNotFound.js';
import Styles from './pages/styles.js';

const root = (
  <div>
  	<Header />
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/styles" component={Styles} />
      <Route component={PageNotFound} />
    </Switch>
  </div>
);
export default root;
