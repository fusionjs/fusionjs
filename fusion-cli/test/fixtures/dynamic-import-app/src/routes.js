import React from 'react';
import {split} from 'fusion-react-async';

const LoadingComponent = () => <div />;
const ErrorComponent = () => <div />;

export default [
  {
    path: '/split-route',
    component: split({
      load() {
        return import('./split-route');
      },
      LoadingComponent,
      ErrorComponent,
    }),
    exact: true,
  },
  {
    path: '/split-route-content',
    component: split({
      load() {
        return import('./split-route-content');
      },
      LoadingComponent,
      ErrorComponent,
    }),
    exact: true,
  },
];
