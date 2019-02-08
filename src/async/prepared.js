/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

const prepared = (sideEffect, opts = {}) => OriginalComponent => {
  opts = Object.assign(
    {
      boundary: false,
      defer: false,
      componentDidMount: true,
      componentWillReceiveProps: false,
      componentDidUpdate: false,
      contextTypes: {},
      forceUpdate: false,
    },
    opts
  );

  class PreparedComponent extends React.Component {
    componentDidMount() {
      if (opts.componentDidMount) {
        Promise.resolve(sideEffect(this.props, this.context)).then(() => {
          if (opts.forceUpdate) {
            this.forceUpdate();
          }
        });
      }
    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
      if (opts.componentWillReceiveProps) {
        sideEffect(nextProps, nextContext);
      }
    }

    componentDidUpdate() {
      if (opts.componentDidUpdate) {
        sideEffect(this.props, this.context);
      }
    }

    render() {
      const prepareState = this.context.__PREPARE_STATE__;
      if (prepareState) {
        if (opts.defer || opts.boundary) {
          // skip prepare if defer or boundary
          return null;
        }

        if (!prepareState.seen.has(PreparedComponent)) {
          // need to mark as seen
          const effectPromise = sideEffect(this.props, this.context);
          prepareState.seen.add(PreparedComponent);
          prepareState.promises.set(PreparedComponent, effectPromise);
          // skip render until effect promise awaited
          return null;
        } else if (prepareState.promises.has(PreparedComponent)) {
          // effect already in progress
          return null;
        }
      }

      return React.createElement(OriginalComponent, this.props);
    }
  }

  PreparedComponent.contextTypes = {
    __PREPARE_STATE__: () => {},
    ...opts.contextTypes,
  };

  const displayName =
    OriginalComponent.displayName || OriginalComponent.name || '';
  PreparedComponent.displayName = `PreparedComponent(${displayName})`;

  return PreparedComponent;
};

export default prepared;
