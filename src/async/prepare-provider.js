/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

class PrepareProvider extends React.Component<*, *> {
  constructor(props: any, context: any) {
    super(props, context);
    this.splitComponentLoaders = [];
    this.markAsCritical = props.markAsCritical;
  }

  splitComponentLoaders: Array<any>;
  markAsCritical: number => void;

  getChildContext() {
    return {
      splitComponentLoaders: this.splitComponentLoaders,
      markAsCritical: this.markAsCritical,
    };
  }
  render() {
    return React.Children.only(this.props.children);
  }
}

PrepareProvider.childContextTypes = {
  splitComponentLoaders: PropTypes.array.isRequired,
  markAsCritical: PropTypes.func,
};

export default PrepareProvider;
