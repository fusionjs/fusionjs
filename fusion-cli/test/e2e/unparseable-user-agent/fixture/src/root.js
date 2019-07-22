// @noflow

import React from 'react';
import Router, {Route, Switch, Link} from 'fusion-plugin-react-router';
import {split} from 'fusion-react';

import routes from './routes';

const LoadingComponent = () => <div />;
const ErrorComponent = () => <div />;
const Page = split({
  load: () => import('./dynamic.js'),
  LoadingComponent,
  ErrorComponent,
});

export default function Root() {
  return (
    <div>
      <Link id="split-route-link" to="/split-route">
        go to split route
      </Link>
      <Page />
      <Switch>
        {routes.map(({path, ...props}) => (
          <Route key={path} path={path} {...props} />
        ))}
      </Switch>
    </div>
  );
}
