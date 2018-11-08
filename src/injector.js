/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import FusionApp, {createPlugin} from 'fusion-core';
import PropTypes from 'prop-types';

type Dependencies = {[string]: any};
type Services = {[string]: any};
type Props = {[string]: any};
type Mapper = Services => Props;

// React.createContext ponyfill
function createContext(value) {
  if ('createContext' in React) {
    return React.createContext<(Dependencies) => Services>(value);
  }

  const key = `_fusionContextPonyfill${Math.random()}`;

  class Provider extends React.Component<*> {
    getChildContext() {
      return {[key]: this.props.value || value};
    }

    render() {
      return this.props.children;
    }
  }

  Provider.childContextTypes = {
    [key]: PropTypes.any.isRequired,
  };

  function Consumer(props: *, context: *) {
    return props.children(context[key]);
  }

  Consumer.contextTypes = {
    [key]: PropTypes.any.isRequired,
  };

  return {
    Provider,
    Consumer,
  };
}

let InjectorContext;

function getServices(app: FusionApp, deps: Dependencies): Services {
  const services = {};

  Object.entries(deps).forEach(([name, token]) => {
    // To be addressed in a future Flow-focued PR.
    // $FlowFixMe
    services[name] = app.getService(token);
  });

  return services;
}

// istanbul ignore next
function defaultInject(deps: Dependencies): Services {
  return {};
}

function defaultMap(services: Services): Props {
  return services;
}

export function registerInjector(app: FusionApp) {
  // Lazily create context for easier testing
  InjectorContext = createContext(defaultInject);

  function inject(deps: Dependencies): Services {
    return getServices(app, deps);
  }

  function renderProvider(children) {
    return (
      <InjectorContext.Provider value={inject}>
        {children}
      </InjectorContext.Provider>
    );
  }

  const injectorPlugin = createPlugin({
    middleware: () => (ctx, next) => {
      ctx.element = ctx.element && renderProvider(ctx.element);

      return next();
    },
  });

  app.register(injectorPlugin);
}

export function withServices(
  deps: Dependencies,
  mapServicesToProps: Mapper = defaultMap
) {
  function resolve(inject, props) {
    const services = inject(deps);
    const serviceProps = mapServicesToProps(services);

    return {
      ...serviceProps,
      ...props,
    };
  }

  function renderConsumer(Component, props) {
    return (
      <InjectorContext.Consumer>
        {inject => <Component {...resolve(inject, props)} />}
      </InjectorContext.Consumer>
    );
  }

  return (Component: React.ComponentType<*>) => {
    return function WithServices(props: *) {
      return renderConsumer(Component, props);
    };
  };
}
