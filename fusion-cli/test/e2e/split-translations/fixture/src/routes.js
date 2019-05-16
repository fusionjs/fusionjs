// @noflow
import React from 'react';
import {split} from 'fusion-react';

const LoadingComponent = () => <div>Loading...</div>;
const ErrorComponent = () => <div>Error</div>;

const component1 = {
  path: '/split1',
  component: split({
    load() {
      return import('./split1');
    },
    LoadingComponent,
    ErrorComponent,
  }),
  exact: true,
};

let component2 = {
  path: '/split2',
  component: split({
    load() {
      return import('./split2');
    },
    LoadingComponent,
    ErrorComponent,
  }),
  exact: true,
};

export default [ component1, component2 ];

if (module.hot) {
  console.log('---these routes shit is hot' +  JSON.stringify(import('./split2').__I18N_KEYS));
  module.hot.accept(() => {
    console.log('lkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk');
    component2.reload();
  });
}
