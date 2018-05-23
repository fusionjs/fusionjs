/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Component} from 'react';
import type {ComponentType} from 'react';
import PropTypes from 'prop-types';

/*
The `withTranslations` HOC takes an array of translation keys as an argument,
but does not use it at runtime.

However, these keys are captured by `babel-plugin-i18n` at compile-time by
Fusion's compiler and the compiler uses generate a map of all translations
in the app.

The translation map is then exposed by `fusion-plugin-i18n/chunk-translation-map.js`
*/
export const withTranslations = (/*translationKeys*/) => {
  return (OriginalComponent: ComponentType<any>) => {
    class WithTranslations extends Component<any> {
      translateProp: any;

      constructor(props: any, context: any) {
        super(props, context);
        const {i18n} = context;
        this.translateProp = i18n
          ? (key, data) => i18n.translate(key, data)
          : key => key;
      }
      render() {
        const finalProps = Object.assign(
          {translate: this.translateProp},
          this.props
        );
        return React.createElement(OriginalComponent, finalProps);
      }
    }
    WithTranslations.contextTypes = OriginalComponent.contextTypes = {
      i18n: PropTypes.object,
    };
    WithTranslations.displayName = `withTranslations(${OriginalComponent.displayName ||
      OriginalComponent.name})`;
    return WithTranslations;
  };
};
