// @flow
/* eslint-env node */
const replaceImportDeclaration = require('../babel-plugin-utils/replace-import-declaration');

module.exports = swPlugin;

function swPlugin(babel /*: Object */) {
  const t = babel.types;
  const visitor = replaceImportDeclaration(t, 'fusion-core');
  return {visitor};
}
