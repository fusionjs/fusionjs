/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

/**
 * Provides styletron instance via old context API
 */

class LegacyStyletronProvider extends React.Component<*, *> {
  styletron: any;

  getChildContext() {
    return {styletron: this.styletron};
  }
  // $FlowFixMe
  constructor(props, context) {
    super(props, context);
    this.styletron = props.value;
  }
  render() {
    return React.Children.only(this.props.children);
  }
}

LegacyStyletronProvider.childContextTypes = {
  styletron: noop,
};

export default LegacyStyletronProvider;

function noop() {}
