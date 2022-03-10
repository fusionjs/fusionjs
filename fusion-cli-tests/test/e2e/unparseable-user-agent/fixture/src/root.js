// @noflow

import React from 'react';
import {Route, Routes, Link} from 'fusion-plugin-react-router';
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
      <Routes>
        {routes.map(({path, ...props}) => (
          <Route key={path} path={path} {...props} />
        ))}
      </Routes>
    </div>
  );
}
