/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

class PrepareState {
  constructor() {
    this.seen = new Set();
    this.promises = new Map();
  }
  consumeAndAwaitPromises() {
    let promises = this.promises.values();
    this.promises = new Map(); // clear
    return Promise.all(promises);
  }
}

export default function prepare(element: any) {
  const renderToStaticMarkup = require('react-dom/server').renderToStaticMarkup;

  const prepareState = new PrepareState();

  class PrepareContextProvider extends React.Component {
    getChildContext() {
      return {
        __PREPARE_STATE__: prepareState,
      };
    }
    render() {
      return element;
    }
  }
  PrepareContextProvider.childContextTypes = {
    __PREPARE_STATE__: () => {},
  };

  function process() {
    const html = renderToStaticMarkup(
      React.createElement(PrepareContextProvider)
    );

    return prepareState.promises.size
      ? prepareState.consumeAndAwaitPromises().then(process)
      : html;
  }

  return Promise.resolve().then(process);
}
