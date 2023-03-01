/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import PropTypes, {Validator} from 'prop-types';
import prepared from './prepared';

declare var __webpack_modules__: {
  [x: string]: any;
};

declare var __webpack_require__: (a: any) => any;

declare global {
  // https://github.com/uber/fusionjs/issues/1577
  // eslint-disable-next-line no-unused-vars
  interface Window {
    webpackChunkFusion: any;
  }
}

const contextTypes: {[k: string]: Validator<any>} = {
  splitComponentLoaders: PropTypes.array.isRequired,
};

if (__NODE__) {
  // $FlowFixMe
  contextTypes.markAsCritical = PropTypes.func;
  // $FlowFixMe
  contextTypes.pushSSRMetadata = PropTypes.func;
}

let cachedLoadedChunkIds;
let lastWebpackChunksLength;
function getLoadedChunkIds() {
  const webpackChunks = __BROWSER__ ? window.webpackChunkFusion : [];

  if (
    cachedLoadedChunkIds &&
    lastWebpackChunksLength === webpackChunks.length
  ) {
    return cachedLoadedChunkIds;
  }

  cachedLoadedChunkIds = new Set(
    webpackChunks.flatMap((chunkTuple) => chunkTuple[0])
  );
  lastWebpackChunksLength = webpackChunks.length;

  return cachedLoadedChunkIds;
}

function webpackChunksLoaded(chunkIds) {
  const loadedChunkIds = getLoadedChunkIds();

  return chunkIds.every((chunkId) => loadedChunkIds.has(chunkId));
}

export default function withAsyncComponent<Config>({
  defer,
  load,
  LoadingComponent,
  ErrorComponent,
}: {
  defer?: boolean;
  load: () => Promise<{
    default: React.ComponentType<Config>;
  }>;
  LoadingComponent: React.ComponentType<any>;
  ErrorComponent: React.ComponentType<any>;
}): React.ComponentType<Config> {
  let AsyncComponent = null;
  let error = null;
  // This stores promise instrumentation used by webpack
  const metadata = {
    chunkIds: [],
    i18nKeys: [],
  };
  let dynamicImportMetadata; // Stores promise instrumentation used by esbuild

  function WithAsyncComponent(props) {
    if (__BROWSER__) {
      // We need to check if the module is already loaded, as it could be marked as
      // critical during SSR. This is crucial in case the prepare ran during SSR,
      // but skipped on the client. In which case the AsyncComponent will never get
      // populated before app is hydrated, causing a rendering mismatch.
      if (!AsyncComponent) {
        let promise = load();
        // @ts-expect-error
        const id = promise.__MODULE_ID;
        // @ts-expect-error
        const chunkIds = promise.__CHUNK_IDS;

        if (
          typeof __webpack_modules__ !== 'undefined' &&
          __webpack_modules__[id] &&
          webpackChunksLoaded(chunkIds)
        ) {
          // If module is already loaded, it can be synchronously imported
          AsyncComponent = __webpack_require__(id).default;
        }
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
          metadata.chunkIds.forEach((chunkId) => {
            context.markAsCritical(chunkId);
          });
        }

        if (__NODE__ && context.pushSSRMetadata && dynamicImportMetadata) {
          context.pushSSRMetadata({
            type: 'critical-dynamic-import',
            data: dynamicImportMetadata,
          });
        }

        if (__DEV__) {
          // In case promise instrumentation has changed, call
          // splitComponentLoaders again
          let componentPromise;
          try {
            componentPromise = load();
          } catch (e) {
            componentPromise = Promise.reject(e) as any;
          }
          // $FlowFixMe
          metadata.chunkIds = componentPromise.__CHUNK_IDS || [];
          // $FlowFixMe
          metadata.i18nKeys = componentPromise.__I18N_KEYS || [];
          dynamicImportMetadata =
            // $FlowFixMe
            componentPromise.__FUSION_DYNAMIC_IMPORT_METADATA__;

          return Promise.all(
            context.splitComponentLoaders.map((loader) =>
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
        componentPromise = Promise.reject(e) as any;
      }

      // $FlowFixMe
      metadata.chunkIds = componentPromise.__CHUNK_IDS || [];
      // $FlowFixMe
      metadata.i18nKeys = componentPromise.__I18N_KEYS || [];
      dynamicImportMetadata =
        // $FlowFixMe
        componentPromise.__FUSION_DYNAMIC_IMPORT_METADATA__;
      if (__NODE__ && context.markAsCritical) {
        // $FlowFixMe
        metadata.chunkIds.forEach((chunkId) => {
          context.markAsCritical(chunkId);
        });
      }

      if (__NODE__ && context.pushSSRMetadata && dynamicImportMetadata) {
        context.pushSSRMetadata({
          type: 'critical-dynamic-import',
          data: dynamicImportMetadata,
        });
      }

      const loadPromises = [
        componentPromise,
        ...context.splitComponentLoaders.map((loader) =>
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
        .catch((err) => {
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
