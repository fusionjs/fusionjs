/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useContext, useMemo} from 'react';
import {I18nContext} from './plugin.js';

export function useTranslations() {
  const i18n = useContext(I18nContext);

  return useMemo(() => i18n.translate.bind(i18n), [i18n]);
}
