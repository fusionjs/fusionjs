/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

import i18n from 'fusion-plugin-i18n';
import type {I18nServiceType} from 'fusion-plugin-i18n';
import {ProviderPlugin} from 'fusion-react';

type ExtractReturnType = <V>(() => V) => V;
class BundleSplitConsumer extends React.Component<*, *> {
  i18n: $Call<ExtractReturnType, $PropertyType<I18nServiceType, 'from'>>;

  constructor(props, context) {
    super(props, context);
    // splitComponentLoaders comes from fusion-react-async/prepare-provider
    // ids comes from fusion-react-async/split
    // props.provides comes from fusion-react/plugin and references i18n()
    this.i18n = props.provides.from(props.ctx);
    if (context.splitComponentLoaders) {
      context.splitComponentLoaders.push(ids => this.i18n.load(ids));
    }
  }
  getChildContext() {
    return {i18n: this.i18n};
  }
  render() {
    return React.Children.only(this.props.children);
  }
}
BundleSplitConsumer.contextTypes = {
  splitComponentLoaders: PropTypes.array,
};
BundleSplitConsumer.childContextTypes = {
  i18n: PropTypes.object.isRequired,
};

export default ProviderPlugin.create('i18n', i18n, BundleSplitConsumer);
