/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const template = require('@babel/template').default;

const createModuleVisitor = require('../babel-plugin-utils/visit-named-module');

const PACKAGE_NAME = ['fusion-plugin-i18n-react', 'fusion-plugin-i18n-preact'];

const COMPONENT_IDENTIFIER = ['Translate', 'withTranslations'];

const TRANSLATIONS_KEY = Symbol('@uber/babel-plugin-i18n translation state');

module.exports = i18nPlugin;

const chunkImportTemplate = template(
  `import { chunkId as LOCAL_ID } from 'fusion-core';`,
  {
    sourceType: 'module',
  }
);

const fileChunkIdTemplate = template(`const CHUNKIDS_ID = LOCAL_ID(FILENAME);`);

// TODO(#4): There might be some issues related to npm module tree resolution here.
// How can we ensure that the singleton instance imported via these packages and elsewhere are the same?
const singletonImportReact = template(
  `
    import LOCAL_SINGLETON from 'fusion-plugin-i18n-react/singleton';
  `,
  {sourceType: 'module'}
);
const singletonImportPreact = template(
  `
    import LOCAL_SINGLETON from 'fusion-plugin-i18n-preact/singleton';
  `,
  {sourceType: 'module'}
);

const singletonImport = {
  'fusion-plugin-i18n-react': singletonImportReact,
  'fusion-plugin-i18n-preact': singletonImportPreact,
};

const builder = template(
  `
    LOCAL_SINGLETON.add(FILENAME, CHUNKIDS_ID, TRANSLATIONS);

    if (module.hot) {
      module.hot.dispose(() => {
        LOCAL_SINGLETON.dispose(FILENAME, CHUNKIDS_ID, TRANSLATIONS);
      });
    }

  `,
  {sourceType: 'module'}
);

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
          const localChunkId = path.scope.generateUidIdentifier('chunkId');
          const chunkImport = chunkImportTemplate({LOCAL_ID: localChunkId});
          const chunkImportPath = appendToBody(path, chunkImport);

          /**
           * We need to update the scope with our new import declaration.
           * `babel-plugin-chunkid` requires this to be accurate to work.
           */
          path.scope.registerDeclaration(chunkImportPath);

          const CHUNKIDS_ID = path.scope.generateUidIdentifier('CHUNKIDS_ID');

          const filenameLiteral = t.stringLiteral(this.file.opts.filename);

          const fileChunkId = fileChunkIdTemplate({
            LOCAL_ID: localChunkId,
            FILENAME: filenameLiteral,
            CHUNKIDS_ID: CHUNKIDS_ID,
          });
          const fileChunkIdPath = appendToBody(path, fileChunkId);

          /**
           * We need to update the binding references since we are adding one.
           * `babel-plugin-chunkid` requires this to be accurate.
           */
          path.scope.bindings[localChunkId.name].reference(
            fileChunkIdPath.get('declarations.0.init.callee')
          );

          const translationsId = path.scope.generateUidIdentifier(
            'translations'
          );

          path.scope.push({
            id: translationsId,
            init: t.arrayExpression(
              Array.from(translations).map(key => t.stringLiteral(key))
            ),
          });

          if (!state.importedPackageName) {
            throw path.buildCodeFrameError(
              'Translate component has to be imported from one of the following packages: fusion-plugin-i18n-react, fusion-plugin-i18n-preact'
            );
          }

          const localSingleton = path.scope.generateUidIdentifier('singleton');

          path.pushContainer(
            'body',
            singletonImport[state.importedPackageName]({
              LOCAL_SINGLETON: localSingleton,
            })
          );

          path.pushContainer(
            'body',
            builder({
              CHUNKIDS_ID: CHUNKIDS_ID,
              TRANSLATIONS: translationsId,
              LOCAL_SINGLETON: localSingleton,
              FILENAME: filenameLiteral,
            })
          );
        }
      },
    },
  };

  return {visitor: Object.assign({}, visitor, programVisitor)};
}

/**
 * Appends a node to the program body and returns the path of the inserted node
 */
function appendToBody(programPath, node) {
  programPath.pushContainer('body', node);
  const bodyPath = programPath.get('body');
  return bodyPath[bodyPath.length - 1];
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
