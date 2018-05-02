/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  I18nToken,
  I18nLoaderToken,
  HydrationStateToken,
  createI18nLoader,
} from 'fusion-plugin-i18n';

import I18n from './plugin';
import {withTranslations} from './with-translations';

export default I18n;
export {I18nToken, I18nLoaderToken, HydrationStateToken, createI18nLoader};
export {Translate} from './translate';

type TranslatePropType = {
  translate: (key: string, interpolations: Object) => string,
};
type WithTranslationsType<TProps> = (
  translationKeys: Array<string>
) => (
  React.ComponentType<TProps>
) => React.ComponentType<TProps | TranslatePropType>;

const withTranslationsTyped: WithTranslationsType<*> = withTranslations;
export {withTranslationsTyped as withTranslations};
