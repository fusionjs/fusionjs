/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import {createPlugin} from 'fusion-core';
import type FusionApp from 'fusion-core';

type Services = {
  [string]: any,
};

const InjectorContext = React.createContext(
  (services: Services): Services => ({})
);

export function resolve(app: FusionApp, services: Services) {
  const resolvedServices = {};

  Object.entries(services).forEach(([name, token]) => {
    resolvedServices[name] = app.services.get(token);
  });

  return resolvedServices;
}

export function prepareInjector(app: FusionApp) {
  function inject(services) {
    return resolve(app, services);
  }

  return createPlugin({
    middleware: () => (ctx, next) => {
      ctx.element = (
        <InjectorContext.Provider value={inject}>
          {ctx.element}
        </InjectorContext.Provider>
      );

      return next();
    },
  });
}

export function withServices(
  Component: React.ComponentType<*>,
  services: Services
) {
  function WithServices(props: *) {
    return (
      <InjectorContext.Consumer>
        {inject => <Component {...inject(services)} {...props} />}
      </InjectorContext.Consumer>
    );
  }

  const displayName = Component.displayName || Component.name;

  WithServices.displayName = `WithServices(${displayName})`;

  return WithServices;
}
