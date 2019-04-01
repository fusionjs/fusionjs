// @flow
import * as React from 'react';
import {createPlugin} from 'fusion-core';
import type FusionApp, {FusionPlugin, Middleware, Token} from 'fusion-core';
import type {Element} from 'react';

type ExtractReturnType = <V>(() => V) => V;

type ServiceContextType<T> = {
  (): $Call<ExtractReturnType, T>,
};

export const ServiceContext = React.createContext<ServiceContextType<any>>(
  () => {}
);

export function useService<T: Token<any>>(token: T): ServiceContextType<T> {
  const getService: T => ServiceContextType<T> = React.useContext(
    ServiceContext
  );
  const provides = getService(token);
  return provides;
}

type ServiceConsumerProps<T> = {
  token: T,
  children: (ServiceContextType<T>) => Element<any>,
};

export function ServiceConsumer<T>({token, children}: ServiceConsumerProps<T>) {
  return (
    <ServiceContext.Consumer>
      {(getService: T => ServiceContextType<T>) => {
        const provides = getService(token);
        return children(provides);
      }}
    </ServiceContext.Consumer>
  );
}

export function serviceContextPlugin(app: FusionApp): FusionPlugin<void, void> {
  return createPlugin({
    middleware(): Middleware {
      return (ctx, next) => {
        ctx.element = ctx.element && (
          <ServiceContext.Provider value={app.getService.bind(app)}>
            {ctx.element}
          </ServiceContext.Provider>
        );
        return next();
      };
    },
  });
}
