/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useTranslations as useTranslationsOriginal} from 'fusion-plugin-i18n-react';

export const useTranslations: () => (
  key: 'test.two'
) => string = useTranslationsOriginal;
