/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';
import prepared from './prepared.js';

declare var __webpack_modules__: {[string]: any};
declare var __webpack_require__: any => any;

const CHUNKS_KEY = '__CHUNK_IDS';

const contextTypes = {
  splitComponentLoaders: PropTypes.array.isRequired,
};

if (__NODE__) {
  // $FlowFixMe
  contextTypes.markAsCritical = PropTypes.func;
}

export default function withAsyncComponent<Config>({
  defer,
  load,
  LoadingComponent,
  ErrorComponent,
}: {
  defer?: boolean,
  load: () => Promise<{default: React.AbstractComponent<Config>}>,
  LoadingComponent: React.AbstractComponent<any>,
  ErrorComponent: React.AbstractComponent<any>,
}): React.AbstractComponent<Config> {
  let AsyncComponent = null;
  let error = null;
  let chunkIds = [];

  function WithAsyncComponent(props) {
    if (__BROWSER__) {
      let promise = load();
      // $FlowFixMe
      let id = promise.__MODULE_ID;

      if (__webpack_modules__[id]) {
        // If module is already loaded, it can be synchronously imported
        AsyncComponent = __webpack_require__(id).default;
      }
    }

    if (error) {
      return <ErrorComponent error={error} />;
    }
    if (!AsyncComponent) {
      return <LoadingComponent />;
    }
    return <AsyncComponent {...props} />;
  }

  return prepared(
    (props, context) => {
      if (AsyncComponent) {
        if (__NODE__ && context.markAsCritical) {
          chunkIds.forEach(chunkId => {
            context.markAsCritical(chunkId);
          });
        }
        return Promise.resolve(AsyncComponent);
      }

      let componentPromise;
      try {
        componentPromise = load();
      } catch (e) {
        componentPromise = Promise.reject(e);
      }

      // $FlowFixMe
      chunkIds = componentPromise[CHUNKS_KEY] || [];

      if (__NODE__ && context.markAsCritical) {
        chunkIds.forEach(chunkId => {
          context.markAsCritical(chunkId);
        });
      }

      const loadPromises = [
        componentPromise,
        ...context.splitComponentLoaders.map(loader => loader(chunkIds)),
      ];

      return Promise.all(loadPromises)
        .then(([asyncComponent]) => {
          // Note: .default is toolchain specific, breaks w/ CommonJS exports
          AsyncComponent = asyncComponent.default;
          if (AsyncComponent === undefined) {
            throw new Error('Bundle does not contain a default export');
          }
        })
        .catch(err => {
          error = err;
          if (__BROWSER__)
            setTimeout(() => {
              throw err;
            }); // log error
        });
    },
    {defer, contextTypes, forceUpdate: true}
  )(WithAsyncComponent);
}
