/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import * as React from 'react';
import type {Element} from 'react';

export const FusionContext = React.createContext<any>({});
export const ServiceContext = React.createContext<any>(() => {
  throw new Error(
    '`ServiceContext.Provider` was not found. This occurs if you are attempting to use `ServiceContext` in a non-React Fusion.js application.'
  );
});

type ReturnsType<T> = () => T;

export function useService<TService>(token: ReturnsType<TService>): TService {
  const getService = React.useContext<(ReturnsType<TService>) => TService>(
    ServiceContext
  );
  const provides = getService(token);
  return provides;
}

type ServiceConsumerProps<TService> = {
  token: ReturnsType<TService>,
  children: TService => Element<any>,
};

export function ServiceConsumer<TService>({
  token,
  children,
}: ServiceConsumerProps<TService>) {
  return (
    <ServiceContext.Consumer>
      {(getService: (ReturnsType<TService>) => TService) => {
        const provides = getService(token);
        return children(provides);
      }}
    </ServiceContext.Consumer>
  );
}

type Dependencies = {[string]: ReturnsType<mixed>};
type Services = {[string]: ReturnsType<mixed>};
type Props = {[string]: any};
type Mapper = Services => Props;

function getServices(getService, deps: Dependencies): Services {
  const services = {};

  Object.keys(deps).forEach((name: string) => {
    services[name] = getService(deps[name]);
  });

  return services;
}

const identity = i => i;

export function withServices(
  deps: Dependencies,
  mapServicesToProps: Mapper = identity
) {
  function resolve(getService) {
    const services = getServices(getService, deps);
    const serviceProps = mapServicesToProps(services);

    return serviceProps;
  }

  return (Component: React.ComponentType<*>) => {
    return function WithServices(props?: Props) {
      return (
        <ServiceContext.Consumer>
          {(getService: <TService>(ReturnsType<TService>) => TService) => (
            <Component {...resolve(getService)} {...props} />
          )}
        </ServiceContext.Consumer>
      );
    };
  };
}
