/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

class PrepareProvider extends React.Component<any, any> {
  constructor(props: any, context: any) {
    super(props, context);
    this.splitComponentLoaders = [];
    this.markAsCritical = props.markAsCritical;
    this.pushSSRMetadata = props.pushSSRMetadata;
  }

  splitComponentLoaders: Array<any>;
  markAsCritical: (chunkId: number) => void;
  pushSSRMetadata: (metadata: any) => void;

  getChildContext() {
    return {
      splitComponentLoaders: this.splitComponentLoaders,
      markAsCritical: this.markAsCritical,
      pushSSRMetadata: this.pushSSRMetadata,
    };
  }
  render() {
    return React.Children.only(this.props.children);
  }

  static childContextTypes = {
    splitComponentLoaders: PropTypes.array.isRequired,
    markAsCritical: PropTypes.func,
    pushSSRMetadata: PropTypes.func,
  };
}

export default PrepareProvider;
