/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import * as React from 'react';
import type {ReactElement} from 'react';

export const FusionContext = React.createContext<any>({});
export const ServiceContext = React.createContext<any>(() => {
  throw new Error(
    '`ServiceContext.Provider` was not found. This occurs if you are attempting to use `ServiceContext` in a non-React Fusion.js application.'
  );
});

type ReturnsType<T> = () => T;

export function useService<TService>(token: ReturnsType<TService>): TService {
  const getService =
    React.useContext<(a: ReturnsType<TService>) => TService>(ServiceContext);
  const provides = getService(token);
  return provides;
}

type ServiceConsumerProps<TService> = {
  token: ReturnsType<TService>;
  children: (a: TService) => ReactElement<any>;
};

export function ServiceConsumer<TService>({
  token,
  children,
}: ServiceConsumerProps<TService>) {
  return (
    <ServiceContext.Consumer>
      {(getService: (a: ReturnsType<TService>) => TService) => {
        const provides = getService(token);
        return children(provides);
      }}
    </ServiceContext.Consumer>
  );
}

type Dependencies = {
  [x: string]: ReturnsType<unknown>;
};

type Services = {
  [x: string]: ReturnsType<unknown>;
};

type Props = {
  [x: string]: any;
};

type Mapper = (a: Services) => Props;

function getServices(getService, deps: Dependencies): Services {
  const services = {};

  Object.keys(deps).forEach((name: string) => {
    services[name] = getService(deps[name]);
  });

  return services;
}

const identity = (i) => i;

export function withServices(
  deps: Dependencies,
  mapServicesToProps: Mapper = identity
) {
  function resolve(getService) {
    const services = getServices(getService, deps);
    const serviceProps = mapServicesToProps(services);

    return serviceProps;
  }

  return (Component: React.ComponentType<any>) => {
    return function WithServices(props?: Props) {
      return (
        <ServiceContext.Consumer>
          {(getService: <TService>(a: ReturnsType<TService>) => TService) => (
            <Component {...resolve(getService)} {...props} />
          )}
        </ServiceContext.Consumer>
      );
    };
  };
}
