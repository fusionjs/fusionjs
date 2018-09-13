/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import PropTypes from 'prop-types';

import FusionApp, {createPlugin} from 'fusion-core';

type Dependencies = {[string]: any};
type Services = {[string]: any};
type Injector = Dependencies => Services;

let _registerInjector;
let _withServices;

function getServices(app: FusionApp, deps: Dependencies): Services {
  const services = {};

  Object.entries(deps).forEach(([name, token]) => {
    const ref = (token && token.ref) || token;

    services[name] = app.services.get(ref);
  });

  return services;
}

if (React.createContext) {
  /* React 16 Context API */

  const InjectorContext = React.createContext(
    (deps: Dependencies): Services => ({})
  );

  _registerInjector = (app: FusionApp) => {
    function inject(deps: Dependencies): Services {
      return getServices(app, deps);
    }

    const injectorPlugin = createPlugin({
      middleware: () => (ctx, next) => {
        ctx.element = ctx.element && (
          <InjectorContext.Provider value={inject}>
            {ctx.element}
          </InjectorContext.Provider>
        );

        return next();
      },
    });

    app.register(injectorPlugin);
  };

  _withServices = (Component: React.ComponentType<*>, deps: Dependencies) => {
    return function WithServices(props: *) {
      return (
        <InjectorContext.Consumer>
          {inject => <Component {...inject(deps)} {...props} />}
        </InjectorContext.Consumer>
      );
    };
  };
} else {
  /* Legacy Context API */

  const injectProp = `$fusion-inject-${Math.random()}$`;

  _registerInjector = (app: FusionApp) => {
    function inject(deps: Dependencies): Services {
      return getServices(app, deps);
    }

    class Provider extends React.Component<*> {
      getChildContext() {
        return {[injectProp]: inject};
      }

      render() {
        return React.Children.only(this.props.children);
      }
    }

    Provider.childContextTypes = {
      [injectProp]: PropTypes.func.isRequired,
    };

    const injectorPlugin = createPlugin({
      middleware: () => (ctx, next) => {
        ctx.element = ctx.element && <Provider>{ctx.element}</Provider>;

        return next();
      },
    });

    app.register(injectorPlugin);
  };

  _withServices = (Component: React.ComponentType<*>, deps: Dependencies) => {
    function WithServices(props: *, context: {[string]: Injector}) {
      return <Component {...context[injectProp](deps)} {...props} />;
    }

    WithServices.contextTypes = {
      [injectProp]: PropTypes.func.isRequired,
    };

    return WithServices;
  };
}

export function registerInjector(...args: *) {
  return _registerInjector(...args);
}

export function withServices(...args: *) {
  return _withServices(...args);
}
