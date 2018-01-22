/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import I18n from './plugin';

export default I18n;
export {
  I18nToken,
  I18nLoaderToken,
  HydrationStateToken,
  createI18nLoader,
} from 'fusion-plugin-i18n';
export {Translate} from './translate';
export {withTranslations} from './with-translations';
