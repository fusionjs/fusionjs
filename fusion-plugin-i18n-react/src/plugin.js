/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

import i18n, {I18nToken} from 'fusion-plugin-i18n';
import type {I18nDepsType, I18nServiceType} from 'fusion-plugin-i18n';
import {FusionContext, ProviderPlugin, useService} from 'fusion-react';

type ExtractReturnType = <V, TArg>((arg: TArg) => V) => V;
export type I18nType = $Call<
  ExtractReturnType,
  $PropertyType<I18nServiceType, 'from'>
>;
export const I18nContext = React.createContext<I18nType>({});

/**
 * The i18n service is loaded with the fusion ctx and provided to the
 * application. This is not explicitly necessary from an API perspective, but it
 * is critical that we register a callback to splitComponentLoaders for
 * dynamically loading translations.
 */
function BundleSplitConsumer(props, {splitComponentLoaders}) {
  const ctx = React.useContext(FusionContext);
  const service: I18nServiceType = useService(I18nToken);
  const i18n = service.from(ctx);
  // Keep track of i18n instance in case of hot-reloading
  const [callbacks, setCallbacks] = React.useState({
    i18n,
    // `i18nKeys` comes from fusion-react/async/split
    load: (_, {i18nKeys}) => i18n.load(i18nKeys),
  });
  // `splitComponentLoaders` comes from fusion-react/async/prepare-provider
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useMemo(() => splitComponentLoaders.push(callbacks.load), []);
  React.useMemo(() => {
    if (i18n !== callbacks.i18n) {
      const index = splitComponentLoaders.find(fn => fn === callbacks.load);
      const load = (_, {i18nKeys}) => i18n.load(i18nKeys);
      splitComponentLoaders.splice(index, 1, load);
      setCallbacks({i18n, load});
    }
  }, [i18n]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <I18nContext.Provider value={callbacks.i18n}>
      {React.Children.only(props.children)}
    </I18nContext.Provider>
  );
}

BundleSplitConsumer.contextTypes = {
  splitComponentLoaders: PropTypes.array,
};

export default ProviderPlugin.create<I18nDepsType, I18nServiceType>(
  'i18n',
  i18n,
  BundleSplitConsumer
);
