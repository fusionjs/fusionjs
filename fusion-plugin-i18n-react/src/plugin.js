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
  React.useMemo(() => {
    // `splitComponentLoaders` comes from fusion-react/async/prepare-provider
    // `ids` comes from fusion-react/async/split
    if (splitComponentLoaders) {
      splitComponentLoaders.push((_, {i18nKeys}) => i18n.load(i18nKeys));
    }
  }, [splitComponentLoaders, i18n]);
  return (
    <I18nContext.Provider value={i18n}>
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
