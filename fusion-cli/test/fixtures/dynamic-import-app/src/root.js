// @flow

import React from 'react';
import Router, {Route, Switch} from 'fusion-plugin-react-router';
import {split} from 'fusion-react-async';

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
      <Page />
      <Switch>
        {routes.map(({path, ...props}) => (
          <Route key={path} path={path} {...props} />
        ))}
      </Switch>
    </div>
  );
}
