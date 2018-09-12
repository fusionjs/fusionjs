/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import FusionApp, {createPlugin} from 'fusion-core';

type Dependencies = {[string]: any};
type Services = {[string]: any};

const InjectorContext = React.createContext(
  (tokens: Dependencies): Services => ({})
);

function getServices(app: FusionApp, deps: Dependencies): Services {
  const serviceMap = {};

  Object.entries(deps).forEach(([name, token]) => {
    const ref = (token && token.ref) || token;

    serviceMap[name] = app.services.get(ref);
  });

  return serviceMap;
}

export function registerInjector(app: FusionApp) {
  function inject(deps: Dependencies): Services {
    return getServices(app, deps);
  }

  const injectorPlugin = createPlugin({
    middleware: () => (ctx, next) => {
      ctx.element = (
        <InjectorContext.Provider value={inject}>
          {ctx.element}
        </InjectorContext.Provider>
      );

      return next();
    },
  });

  app.register(injectorPlugin);
}

export function withServices(
  Component: React.ComponentType<*>,
  deps: Dependencies
) {
  function WithServices(props: *) {
    return (
      <InjectorContext.Consumer>
        {inject => <Component {...inject(deps)} {...props} />}
      </InjectorContext.Consumer>
    );
  }

  const displayName = Component.displayName || Component.name;

  WithServices.displayName = `WithServices(${displayName})`;

  return WithServices;
}
