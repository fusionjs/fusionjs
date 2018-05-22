/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class FontProvider extends Component<*, *> {
  constructor(props: *, context: *) {
    super(props, context);
    this.getFontDetails = props.getFontDetails;
  }

  getFontDetails: {};

  getChildContext() {
    return {
      getFontDetails: this.props.getFontDetails,
    };
  }
  render() {
    return React.Children.only(this.props.children);
  }
}

FontProvider.propTypes = {
  getFontDetails: PropTypes.func.isRequired,
  children: PropTypes.element.isRequired,
};
FontProvider.childContextTypes = {
  getFontDetails: PropTypes.func.isRequired,
};
