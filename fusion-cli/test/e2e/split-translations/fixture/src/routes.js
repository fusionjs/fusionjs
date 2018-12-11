// @noflow
import React from 'react';
import {split} from 'fusion-react';

const LoadingComponent = () => <div>Loading...</div>;
const ErrorComponent = () => <div>Error</div>;

export default [
  {
    path: '/split1',
    component: split({
      load() {
        return import('./split1');
      },
      LoadingComponent,
      ErrorComponent,
    }),
    exact: true,
  },
  {
    path: '/split2',
    component: split({
      load() {
        return import('./split2');
      },
      LoadingComponent,
      ErrorComponent,
    }),
    exact: true,
  },
];
