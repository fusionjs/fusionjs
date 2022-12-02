/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useContext, useMemo} from 'react';
import {I18nContext} from './plugin';

export function useTranslations() {
  const i18n = useContext(I18nContext);
  if (!i18n || !i18n.translate) {
    throw new Error(
      'Could not find i18n React context. Perhaps the context provider is missing (i.e. fusion-plugin-i18n-react was not registered) or the provider and useTranslations are referencing different instances of the fusion-plugin-i18n-react React context (i.e. multiple instances of fusion-plugin-i81n-react in the dependency tree).'
    );
  }
  return useMemo(() => i18n.translate.bind(i18n), [i18n]);
}
