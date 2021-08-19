/** Copyright (c) 2021 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as fusion_core from 'fusion-core';
import * as React from 'react';
import React__default from 'react';
import {I18nDepsType, I18nServiceType} from 'fusion-plugin-i18n';
export {
  HydrationStateToken,
  I18nDepsType,
  I18nLoaderToken,
  I18nServiceType,
  I18nToken,
  I18nTranslateFnsToken,
  TranslateFuncType,
  TranslationsObjectType,
  createI18nLoader,
} from 'fusion-plugin-i18n';

declare type I18nType = ReturnType<I18nServiceType['from']>;
declare const I18nContext: React.Context<I18nType>;
declare const _default: fusion_core.FusionPlugin<I18nDepsType, I18nServiceType>;

declare const withTranslations: (
  translationKeys: string[]
) => <T extends unknown>(
  Component: React__default.ComponentType<T>
) => new (...args: any) => React__default.Component<
  Omit<T, 'translate' | 'localeCode'>,
  {},
  any
>;

declare function useTranslations(): any;

declare type TranslatePropsType = {
  id: string;
  data?: any;
};
declare function Translate(props: TranslatePropsType): JSX.Element;

export {
  I18nContext,
  Translate,
  _default as default,
  useTranslations,
  withTranslations,
};
