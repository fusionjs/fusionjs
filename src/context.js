// @flow
import * as React from 'react';
import {createPlugin} from 'fusion-core';
import type FusionApp, {FusionPlugin, Middleware, Token} from 'fusion-core';
import type {Element} from 'react';

export const FusionContext = React.createContext<any>({});
export const ServiceContext = React.createContext<any>(() => {});

export function useService<TService>(token: Token<TService>): TService {
  const getService: (Token<TService>) => TService = React.useContext(
    ServiceContext
  );
  const provides = getService(token);
  return provides;
}

type ServiceConsumerProps<TService> = {
  token: Token<TService>,
  children: TService => Element<any>,
};

export function ServiceConsumer<TService>({
  token,
  children,
}: ServiceConsumerProps<TService>) {
  return (
    <ServiceContext.Consumer>
      {(getService: (Token<TService>) => TService) => {
        const provides = getService(token);
        return children(provides);
      }}
    </ServiceContext.Consumer>
  );
}

export function serviceContextPlugin(app: FusionApp): FusionPlugin<void, void> {
  function getService(token) {
    const provides = app.getService(token);
    if (typeof provides === 'undefined') {
      throw new Error(
        `Token not registered or registered plugin does not provide a service: For token ${
          token.name
        }`
      );
    }
    return provides;
  }
  return createPlugin({
    middleware(): Middleware {
      return (ctx, next) => {
        ctx.element = ctx.element && (
          <FusionContext.Provider value={ctx}>
            <ServiceContext.Provider value={getService}>
              {ctx.element}
            </ServiceContext.Provider>
          </FusionContext.Provider>
        );
        return next();
      };
    },
  });
}
