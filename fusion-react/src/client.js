/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import * as React from 'react';

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
    if (version.startsWith("18.")) {
      const { createRoot } = require("react-dom/client")
      const { startTransition } = require("react")
      startTransition(() => {
        createRoot(domElement)?.render(el)
      })
    } else {
      const { render } = require("react-dom")
      render(el, domElement);
    }
  } else {
    if (version.startsWith("18.")) {
      const { hydrateRoot, createRoot } = require("react-dom/client")
      return hydrateRoot ? hydrateRoot(domElement, el) : createRoot(domElement).render(el)
    } else {
      const ReactDOM = require("react-dom")
      return ReactDOM.hydrate
        ? ReactDOM.hydrate(el, domElement)
        : ReactDOM.render(el, domElement);
    }
  }
};
