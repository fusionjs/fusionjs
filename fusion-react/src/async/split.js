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
  load: () => Promise<{default: React.ComponentType<Config>}>,
  LoadingComponent: React.ComponentType<any>,
  ErrorComponent: React.ComponentType<any>,
}): React.ComponentType<Config> {
  let AsyncComponent = null;
  let error = null;
  const metadata = {
    chunkIds: [],
    i18nKeys: [],
  };

  function WithAsyncComponent(props) {
    if (__BROWSER__) {
      let promise = load();
      // $FlowFixMe
      let id = promise.__MODULE_ID;

      if (
        typeof __webpack_modules__ !== 'undefined' &&
        __webpack_modules__[id]
      ) {
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
          metadata.chunkIds.forEach(chunkId => {
            context.markAsCritical(chunkId);
          });
        }
        if (__DEV__) {
          // In case promise instrumentation has changed, call
          // splitComponentLoaders again
          let componentPromise;
          try {
            componentPromise = load();
          } catch (e) {
            componentPromise = (Promise.reject(e): any);
          }
          // $FlowFixMe
          metadata.chunkIds = componentPromise.__CHUNK_IDS || [];
          // $FlowFixMe
          metadata.i18nKeys = componentPromise.__I18N_KEYS || [];
          return Promise.all(
            context.splitComponentLoaders.map(loader =>
              loader(metadata.chunkIds, metadata)
            )
          ).then(() => AsyncComponent);
        } else {
          return Promise.resolve(AsyncComponent);
        }
      }

      let componentPromise;
      try {
        componentPromise = load();
      } catch (e) {
        componentPromise = (Promise.reject(e): any);
      }

      // $FlowFixMe
      metadata.chunkIds = componentPromise.__CHUNK_IDS || [];
      // $FlowFixMe
      metadata.i18nKeys = componentPromise.__I18N_KEYS || [];

      if (__NODE__ && context.markAsCritical) {
        metadata.chunkIds.forEach(chunkId => {
          context.markAsCritical(chunkId);
        });
      }

      const loadPromises = [
        componentPromise,
        ...context.splitComponentLoaders.map(loader =>
          loader(metadata.chunkIds, metadata)
        ),
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
