import React from 'react';
import {split} from 'fusion-react-async';

const LoadingComponent = () => <div />;
const ErrorComponent = () => <div />;
const Page = split({
  load: () => import('./dynamic.js'),
  LoadingComponent,
  ErrorComponent,
});

const root = (
  <div>
    <Page />
  </div>
);

export default root;
