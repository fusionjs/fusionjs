/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
/* global module */

import * as React from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';

// Save a reference to the root that we can reuse upon HMR. The new createRoot/hydrateRoot
// API's can only be called once
let root = null;
// Client HMR
if (typeof module !== 'undefined' && module.hot) {
  // $FlowFixMe
  module.hot.addDisposeHandler((data) => {
    data.oldRoot = root;
  });
  // $FlowFixMe
  if (module.hot.data) {
    // $FlowFixMe
    root = module.hot.data.oldRoot;
  }
}

export default (el: React.Element<*>) => {
  const domElement = document.getElementById('root');

  if (!domElement) {
    throw new Error("Could not find 'root' element");
  }

  const ssrFailed = document.querySelector('[data-fusion-render="client"]');

  if (ssrFailed) {
    if (__DEV__) {
      console.error(
        'Server-side render failed. Falling back to client-side render'
      );
    }
    if (!root) {
      root = createRoot(domElement);
    }
    root.render(el);
  } else {
    if (root) {
      return root.render(el);
    } else {
      root = hydrateRoot(domElement, el);
      return root;
    }
  }
};
