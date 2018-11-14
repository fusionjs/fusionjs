/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

import {ProviderPlugin} from 'fusion-react';
import rpc, {mock as RPCMock} from 'fusion-plugin-rpc';
import type {RPCType, RPCDepsType} from 'fusion-plugin-rpc';

class RPCProvider extends React.Component<*> {
  rpc: typeof rpc;

  constructor(props, context) {
    super(props, context);
    this.rpc = props.provides.from(props.ctx);
  }
  getChildContext() {
    return {rpc: this.rpc};
  }
  render() {
    return React.Children.only(this.props.children);
  }
}

RPCProvider.childContextTypes = {
  rpc: PropTypes.object.isRequired,
};

export default ProviderPlugin.create<RPCDepsType, RPCType>(
  'rpc',
  rpc,
  RPCProvider
);
export const mock = ProviderPlugin.create<RPCDepsType, RPCType>(
  'rpc',
  RPCMock,
  RPCProvider
);
