/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

import i18n from 'fusion-plugin-i18n';
import type {I18nDepsType, I18nServiceType} from 'fusion-plugin-i18n';
import {ProviderPlugin} from 'fusion-react';
import chunkTranslationMap from 'fusion-plugin-i18n/chunk-translation-map';

/*
function i18nKeysFromChunkIds(chunkIds) {
  const i18nKeys = [];
  console.log(JSON.stringify({chunkIds}))
  for (let chunkId of chunkIds) {
    i18nKeys.push(
      ...chunkTranslationMap.translationsForChunk(chunkId)
    );
  }
  console.log(JSON.stringify({i18nKeys}))
  return i18nKeys;
}
*/

type ExtractReturnType = <V, TArg>((arg: TArg) => V) => V;
class BundleSplitConsumer extends React.Component<*, *> {
  i18n: $Call<ExtractReturnType, $PropertyType<I18nServiceType, 'from'>>;

  constructor(props, context) {
    super(props, context);
    // splitComponentLoaders comes from fusion-react-async/prepare-provider
    // ids comes from fusion-react-async/split
    // props.provides comes from fusion-react/plugin and references i18n()
    this.i18n = props.provides.from(props.ctx);
    if (context.splitComponentLoaders) {
      context.splitComponentLoaders.push((_, {i18nKeys}) => {
        //this.i18n.load(i18nKeysFromChunkIds(chunkIds))
        console.log('split i18nkeys ' + JSON.stringify(i18nKeys));
        return this.i18n.load(i18nKeys)
      });
    }
  }
  getChildContext() {
    return {i18n: this.i18n};
  }
  render() {
    return React.Children.only(this.props.children);
  }
}
BundleSplitConsumer.contextTypes = {
  splitComponentLoaders: PropTypes.array,
};
BundleSplitConsumer.childContextTypes = {
  i18n: PropTypes.object.isRequired,
};

export default ProviderPlugin.create<I18nDepsType, I18nServiceType>(
  'i18n',
  i18n,
  BundleSplitConsumer
);
