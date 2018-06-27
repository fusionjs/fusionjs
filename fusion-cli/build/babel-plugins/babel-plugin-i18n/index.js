/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const i18nManifest = require('../../i18n-manifest.js');
const createModuleVisitor = require('../babel-plugin-utils/visit-named-module');

const PACKAGE_NAME = ['fusion-plugin-i18n-react', 'fusion-plugin-i18n-preact'];
const COMPONENT_IDENTIFIER = ['Translate', 'withTranslations'];
const TRANSLATIONS_KEY = Symbol('@uber/babel-plugin-i18n translation state');

module.exports = i18nPlugin;

function i18nPlugin(babel /*: Object */) {
  const t /*: Object */ = babel.types;
  const visitor = createModuleVisitor(
    t,
    COMPONENT_IDENTIFIER,
    PACKAGE_NAME,
    refsHandler
  );

  const programVisitor = {
    Program: {
      enter(path, state) {
        Object.defineProperty(state, TRANSLATIONS_KEY, {
          value: new Set(),
        });
      },

      exit(path, state) {
        const translations = state[TRANSLATIONS_KEY];
        if (translations.size > 0) {
          i18nManifest.set(this.file.opts.filename, translations);
        }
      },
    },
  };

  return {visitor: Object.assign({}, visitor, programVisitor)};
}

function refsHandler(t, context, refs = [], specifierName) {
  refs.forEach(refPath => {
    if (t.isCallExpression(refPath.parent)) {
      const firstArg = refPath.parent.arguments[0];
      if (specifierName === 'withTranslations') {
        const errorMessage =
          'The withTranslations hoc must be called with an array of string literal translation keys';
        if (!t.isArrayExpression(firstArg)) {
          throw new Error(errorMessage);
        }
        const elements = firstArg.elements;
        elements.forEach(element => {
          if (!t.isStringLiteral(element)) {
            throw new Error(errorMessage);
          }
          context[TRANSLATIONS_KEY].add(element.value);
        });
      }
      return;
    }
    if (!t.isJSXOpeningElement(refPath.parent)) {
      return;
    }
    refPath.parent.attributes.forEach(attr => {
      if (!t.isJSXAttribute(attr)) {
        return;
      }
      if (!t.isJSXIdentifier(attr.name)) {
        return;
      }
      if (!t.isStringLiteral(attr.value)) {
        return;
      }
      if (attr.name.name !== 'id') {
        return;
      }
      if (!t.isStringLiteral(attr.value)) {
        throw new Error(
          'The translate component must have props.id be a string literal.'
        );
      }
      const translationKeyId = attr.value.value;
      context[TRANSLATIONS_KEY].add(translationKeyId);
    });
  });
}
