/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

type PreparedOpts = {
  boundary?: boolean,
  defer?: boolean,
  componentDidMount?: boolean,
  componentWillReceiveProps?: boolean,
  componentDidUpdate?: boolean,
  contextTypes?: Object,
  forceUpdate?: boolean,
};

const prepared = (
  sideEffect: (any, any) => Promise<any>,
  opts?: PreparedOpts = {}
) => <Config>(
  OriginalComponent: React.ComponentType<Config>
): React.ComponentType<{...Config, effectId?: string}> => {
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

  class PreparedComponent extends React.Component<any> {
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
      const effectId = this.props.effectId || 'defaultId';
      const prepareState = this.context.__PREPARE_STATE__;
      if (prepareState) {
        if (opts.defer || opts.boundary) {
          // skip prepare if defer or boundary
          return null;
        }

        const isResolved = prepareState.isResolved(
          PreparedComponent,
          effectId,
          () => sideEffect(this.props, this.context)
        );

        if (!isResolved) {
          // Wait until resolved
          return null;
        }
      }

      return <OriginalComponent {...this.props} />;
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
