// @noflow

import React from 'react';
import Router, {Route, Switch, Link} from 'fusion-plugin-react-router';
import {split} from 'fusion-react';

const LoadingComponent = () => <div />;
const ErrorComponent = () => <div />;

const A = split({
  load() {
    return import('./split-a');
  },
  LoadingComponent,
  ErrorComponent,
});

const B = split({
  load() {
    return import('./split-b');
  },
  LoadingComponent,
  ErrorComponent,
});

export default function Root() {
  return (
    <div>
      <Switch>
        <Route exact path={'/split-a'} component={A} />
        <Route exact path={'/split-b'} component={A} />
      </Switch>
    </div>
  );
}
