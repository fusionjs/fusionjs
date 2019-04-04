/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import I18n from './plugin';

export {
  I18nToken,
  I18nLoaderToken,
  HydrationStateToken,
  createI18nLoader,
} from 'fusion-plugin-i18n';
export type {
  I18nDepsType,
  I18nServiceType,
  TranslationsObjectType,
  TranslateFuncType,
} from 'fusion-plugin-i18n';

export {withTranslations} from './with-translations';
export {Translate} from './translate';

export default I18n;
