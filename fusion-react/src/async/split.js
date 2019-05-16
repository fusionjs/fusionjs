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

export type InstrumentedPromise<T> = Promise<{
  default: React.ComponentType<T>,
}> & {
  __MODULE_ID: string,
  __CHUNK_IDS: Array<string>,
  __I18N_KEYS: Array<string>,
};

declare var __webpack_modules__: {[string]: any};
declare var __webpack_require__: any => any;

const CHUNKS_KEY = '__CHUNK_IDS';
const I18N_KEY = '__I18N_KEYS';
const MODULE_KEY = '__MODULE_ID';

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
  load: () => InstrumentedPromise<Config>,
  LoadingComponent: React.ComponentType<any>,
  ErrorComponent: React.ComponentType<any>,
}): React.ComponentType<Config> {
  let AsyncComponent = null;
  let error = null;
  const metadata = {
    chunkIds: [],
    i18nKeys: [],
    moduleId: null,
  };

  function WithAsyncComponent(props) {
    console.log('rendering async component')
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


  class Split extends React.Component {
    constructor(props) {
      super(props);
      console.log('split constructor')
      this.state = {
        prepared: this.getPrepared(),
        metadata: {},
        loadPromises: [],
      };
    }
    reload () {
      this.setState({
        prepared: this.getPrepared(),
      });
    }
    addHot() {
      console.log('add hot. module = ' + JSON.stringify(module));
      if (module.hot) {
        this.reload();
        console.log('hot module found ------------------ ' + JSON.stringify(this.state));
        const cp = load();
        console.log(JSON.stringify(cp[CHUNKS_KEY]));
        console.log(JSON.stringify(cp[I18N_KEY]));
        console.log(JSON.stringify(cp[MODULE_KEY]));
        module.hot.accept(this.state.metadata.moduleId, () => {
          console.log('============================================== accepting hot!!!!');
          const { loadPromises } = this.state;
          loadPromises.push(
            ...this.context.splitComponentLoaders.map(loader =>
              loader(metadata.chunkIds, metadata)
            )
          );
          this.setState({ loadPromises });
        });
      }
    }
    getPrepared () {
      return prepared(
        (props, context) => {
          if (AsyncComponent) {
            if (__NODE__ && context.markAsCritical) {
              metadata.chunkIds.forEach(chunkId => {
                context.markAsCritical(chunkId);
              });
            }
            return Promise.resolve(AsyncComponent);
          }

          let componentPromise;
          try {
            componentPromise = load();
          } catch (e) {
            componentPromise = (Promise.reject(e): any);
          }

          console.log('promise chunks ' + JSON.stringify(componentPromise[CHUNKS_KEY]));
          console.log('promise i18n ' + JSON.stringify(componentPromise[I18N_KEY]));

          metadata.chunkIds = componentPromise[CHUNKS_KEY] || [];
          metadata.i18nKeys = componentPromise[I18N_KEY] || [];
          metadata.moduleId = componentPromise[MODULE_KEY] || [];

          if (__NODE__ && context.markAsCritical) {
            metadata.chunkIds.forEach(chunkId => {
              context.markAsCritical(chunkId);
            });
          }

          console.log('splitComponentLoaders ' + context.splitComponentLoaders.length);

          const loadPromises = [
            componentPromise,
            ...context.splitComponentLoaders.map(loader =>
              loader(metadata.chunkIds, metadata)
            ),
          ];

          this.setState({metadata, loadPromises});

          return Promise.all(loadPromises)
            .then(([asyncComponent]) => {
              // Note: .default is toolchain specific, breaks w/ CommonJS exports
              console.log('got async component');
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
    render () {
      this.addHot();
      console.log('rendering split');
      const Component = this.state.prepared;
      return <Component />;
    }
  }

  Split.contextTypes = {
    splitComponentLoaders: PropTypes.array.isRequired,
  };

  return Split;
}

if (module.hot) {
  console.log('sppppppppppppppppppppppppplit hot');
  module.hot.accept();
}
