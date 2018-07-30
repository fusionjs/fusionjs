/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import PropTypes from 'prop-types';
import prepared from './prepared.js';

const CHUNKS_KEY = '__CHUNK_IDS';

const contextTypes = {
  splitComponentLoaders: PropTypes.array.isRequired,
};

if (__NODE__) {
  // $FlowFixMe
  contextTypes.preloadChunks = PropTypes.array.isRequired;
}

// $FlowFixMe
export default function withAsyncComponent({
  defer,
  load,
  LoadingComponent,
  ErrorComponent,
}) {
  let AsyncComponent = null;
  let error = null;
  let chunkIds = [];

  function WithAsyncComponent(props) {
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
        if (__NODE__) {
          chunkIds.forEach(chunkId => {
            context.preloadChunks.push(chunkId);
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

      if (__NODE__) {
        chunkIds.forEach(chunkId => {
          context.preloadChunks.push(chunkId);
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
