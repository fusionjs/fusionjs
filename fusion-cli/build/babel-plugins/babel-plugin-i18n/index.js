/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const createModuleVisitor = require('../babel-plugin-utils/visit-named-module');

const PACKAGE_NAME = ['fusion-plugin-i18n-react', 'fusion-plugin-i18n-preact'];
const COMPONENT_IDENTIFIER = [
  'Translate',
  'withTranslations',
  'useTranslations',
];

module.exports = i18nPlugin;

/*::
type PluginOpts = {translationIds: Set<string>}
*/

function i18nPlugin(babel /*: Object */, {translationIds} /*: PluginOpts */) {
  const t /*: Object */ = babel.types;
  const visitor = createModuleVisitor(
    t,
    COMPONENT_IDENTIFIER,
    PACKAGE_NAME,
    refsHandler
  );

  function refsHandler(t, context, refs = [], specifierName) {
    refs.forEach(refPath => {
      const parentPath = refPath.parentPath;
      if (t.isCallExpression(refPath.parent)) {
        const firstArg = refPath.parent.arguments[0];
        if (specifierName === 'withTranslations') {
          const errorMessage =
            'The withTranslations hoc must be called with an array of string literal translation keys';
          if (!t.isArrayExpression(firstArg)) {
            throw parentPath.buildCodeFrameError(errorMessage);
          }
          const elements = firstArg.elements;
          elements.forEach(element => {
            if (!t.isStringLiteral(element)) {
              throw parentPath.buildCodeFrameError(errorMessage);
            }
            translationIds.add(element.value);
          });
        } else if (specifierName === 'useTranslations') {
          if (!t.isVariableDeclarator(refPath.parentPath.parent)) {
            throw parentPath.buildCodeFrameError(
              'Unexpected assignment of useTranslations return function'
            );
          }
          const localName = refPath.parentPath.parent.id.name;
          const translationPaths =
            refPath.parentPath.scope.bindings[localName].referencePaths;
          translationPaths.forEach(translationPath => {
            if (
              // translate()
              t.isCallExpression(translationPath.parentPath) &&
              translationPath.parentKey === 'callee'
            ) {
              const arg = translationPath.parentPath.node.arguments[0];
              const errorMessage =
                'useTranslations result function must be passed string literal or hinted template literal';
              if (t.isStringLiteral(arg)) {
                translationIds.add(arg.value);
              } else if (t.isTemplateLiteral(arg)) {
                const literalSections = arg.quasis.map(q => q.value.cooked);
                if (literalSections.join('') === '') {
                  // template literal not hinted, i.e. translate(`${foo}`)
                  throw translationPath.parentPath.buildCodeFrameError(
                    errorMessage
                  );
                } else {
                  translationIds.add(literalSections);
                }
              } else {
                throw translationPath.parentPath.buildCodeFrameError(
                  errorMessage
                );
              }
            } else if (
              // React.useEffect(() => {}, [translate])
              t.isArrayExpression(translationPath.parentPath) &&
              t.isCallExpression(translationPath.parentPath.parentPath)
            ) {
              const reactHooksWithCallbacks = [
                'useEffect',
                'useCallback',
                'useMemo',
              ];
              const arrayArg = translationPath.parentPath.node;
              const hookCall = translationPath.parentPath.parentPath.node;
              const isSecondArg =
                hookCall.arguments &&
                hookCall.arguments.length > 1 &&
                hookCall.arguments[1] === arrayArg;
              const isValidIdentifierCall =
                t.isIdentifier(hookCall.callee) &&
                reactHooksWithCallbacks.includes(hookCall.callee.name);
              const isValidMemberCall =
                t.isMemberExpression(hookCall.callee) &&
                reactHooksWithCallbacks.includes(hookCall.callee.property.name);
              if (
                !(isSecondArg && (isValidIdentifierCall || isValidMemberCall))
              ) {
                throw translationPath.parentPath.buildCodeFrameError(
                  'Unexpected usage of useTranslations return function'
                );
              }
            } else {
              throw translationPath.parentPath.buildCodeFrameError(
                'Unexpected usage of useTranslations return function'
              );
            }
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
        if (attr.name.name !== 'id') {
          return;
        }
        if (!t.isStringLiteral(attr.value)) {
          throw parentPath.buildCodeFrameError(
            'The translate component must have props.id be a string literal.'
          );
        }
        const translationKeyId = attr.value.value;
        translationIds.add(translationKeyId);
      });
    });
  }

  return {visitor};
}
