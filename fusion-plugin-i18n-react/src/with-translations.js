/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import PropTypes from 'prop-types';
import type {Context} from 'fusion-core';

type TranslateType = (
  key: string,
  interpolations?: {[string]: string | number}
) => string;

/*
The `withTranslations` HOC takes an array of translation keys as an argument,
but does not use it at runtime.
However, these keys are captured by `babel-plugin-i18n` at compile-time by
Fusion's compiler and the compiler uses generate a map of all translations
in the app.
The translation map is then exposed by `fusion-plugin-i18n/chunk-translation-map.js`
*/

export const withTranslations = (
  translationKeys: string[] /*translationKeys*/
) => {
  return <T: {}>(
    Component: React$ComponentType<T>
  ): Class<
    React$Component<
      $Diff<T, {|translate?: TranslateType, localeCode?: string|}>
    >
  > => {
    class WithTranslations extends React.Component<T> {
      translate: TranslateType;
      localeCode: string;

      constructor(props: T, context: Context) {
        super(props, context);
        const {i18n} = context;
        this.localeCode = i18n ? i18n.localeCode : 'en_US';
        this.translate = i18n
          ? (key: string, interpolations?: {[string]: string | number}) =>
              i18n.translate(key, interpolations)
          : (key: string) => key;
      }

      render() {
        return (
          <Component
            {...this.props}
            translate={this.translate}
            localeCode={this.localeCode}
          />
        );
      }
    }

    const displayName = Component.displayName || Component.name || 'Anonymous';
    WithTranslations.displayName = `withTranslations(${displayName})`;
    WithTranslations.contextTypes = {
      i18n: PropTypes.object.isRequired,
    };

    return WithTranslations;
  };
};
