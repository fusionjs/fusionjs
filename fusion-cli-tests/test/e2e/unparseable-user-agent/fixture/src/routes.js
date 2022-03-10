// @noflow
import React from 'react';
import {split} from 'fusion-react';

const LoadingComponent = () => <div />;
const ErrorComponent = () => <div />;

export default [
  {
    path: '/split-route',
    element: React.createElement(split({
      load() {
        return import('./split-route');
      },
      LoadingComponent,
      ErrorComponent,
    })),
    caseSensitive: true,
  },
  {
    path: '/split-route-content',
    element: React.createElement(split({
      load() {
        return import('./split-route-content');
      },
      LoadingComponent,
      ErrorComponent,
    })),
    caseSensitive: true,
  },
];
