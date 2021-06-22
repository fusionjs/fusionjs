// @noflow
/* eslint-env node */

const {relative} = require('path');

module.exports = function (babel) {
  const {types: t} = babel;

  return {
    name: 'fusion-instrument-dynamic-import',
    visitor: {
      Import(path, state) {
        let parentPath = path.parentPath;
        let parent = parentPath.node;

        let arg = parent.arguments[0];

        if (!state.file.opts.filename) {
          throw new Error(
            'Filename is required for fusion-instrument-dynamic-import'
          );
        }

        let filename = relative(state.cwd, state.file.opts.filename);

        let property = t.objectExpression([
          t.objectProperty(
            t.stringLiteral('value'),
            t.objectExpression([
              t.objectProperty(t.stringLiteral('version'), t.numericLiteral(1)),
              t.objectProperty(
                t.stringLiteral('origin'),
                t.stringLiteral(filename)
              ),
              t.objectProperty(t.stringLiteral('target'), arg),
            ])
          ),
        ]);
        let wrapper = t.callExpression(
          t.memberExpression(
            t.identifier('Object'),
            t.identifier('defineProperty')
          ),
          [
            parent,
            t.stringLiteral('__FUSION_DYNAMIC_IMPORT_METADATA__'),
            property,
          ]
        );
        parentPath.replaceWith(wrapper);
        parentPath.skip();
      },
    },
  };
};
