/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import Plugin, {
  I18nToken,
  I18nLoaderToken,
  HydrationStateToken,
  createI18nLoader,
  Translate,
  withTranslations,
} from '../src/index.js';

test('exports', () => {
  expect(typeof Plugin).toBe('object');
  expect(typeof I18nToken).toBe('object');
  expect(typeof I18nLoaderToken).toBe('object');
  expect(typeof HydrationStateToken).toBe('object');
  expect(typeof createI18nLoader).toBe('function');
  expect(typeof Translate).toBe('function');
  expect(typeof withTranslations).toBe('function');
});
