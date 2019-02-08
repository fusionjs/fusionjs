/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const React = require('react');
const renderToStaticMarkup = require('react-dom/server').renderToStaticMarkup;

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

function getMarkupFromTree(tree) {
  const prepareState = new PrepareState();

  class PrepareContextProvider extends React.Component {
    getChildContext() {
      return {
        __PREPARE_STATE__: prepareState,
        __IS_PREPARE__: true,
      };
    }
    render() {
      return tree;
    }
  }
  PrepareContextProvider.childContextTypes = {
    __PREPARE_STATE__: () => {},
    __IS_PREPARE__: () => {},
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

function prepare(element: any) {
  // context.__IS_PREPARE__ = true;
  return getMarkupFromTree(element);
}

export default prepare;
