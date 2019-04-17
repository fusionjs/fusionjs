/** Copyright (c) 2019 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import * as React from 'react';
import {createPlugin} from 'fusion-core';
import type FusionApp, {FusionPlugin, Middleware} from 'fusion-core';
import type {Element} from 'react';

export const FusionContext = React.createContext<any>({});
export const ServiceContext = React.createContext<any>(() => {});

type ReturnsType<T> = () => T;

export function useService<TService>(token: ReturnsType<TService>): TService {
  const getService: (ReturnsType<TService>) => TService = React.useContext(
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

export function serviceContextPlugin(app: FusionApp): FusionPlugin<void, void> {
  function getService(token) {
    const provides = app.getService(token);
    const isRequiredToken = Boolean(token.optional);
    if (typeof provides === 'undefined' && isRequiredToken) {
      throw new Error(
        `Token ${
          token.name
        } not registered or registered plugin does not provide a service. To use an optional plugin, use \`Token.optional\`.`
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
