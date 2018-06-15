/* @flow */

/**
 * Note: this plugin probably becomes redundant (assuming Webpack is used) once
 * https://github.com/webpack/webpack/issues/7519 is resolved
 */

/* eslint-env node */
module.exports = (
  babel /*: any */,
  {target} /*: {target: "node" | "browser"} */
) => {
  const {types: t} = babel;
  return {
    name: 'transform-tree-shake',
    visitor: {
      ImportDeclaration(path /* :any */) {
        if (path.removed) {
          return;
        }
        const specifiers = path.get('specifiers');

        // Imports with no specifiers is probably specifically for side effects
        let shakeDeclaration = specifiers.length > 0;

        for (const specifier of specifiers) {
          let shakeSpecifier = true;

          const localPath = specifier.get('local');
          const localName = localPath.node.name;
          // This should not be hardcoded to React and/or improve compat with JSX transform
          // However, this stopgap is fine until this plugin is made redundant by
          // https://github.com/webpack/webpack/issues/7519
          if (localName === 'React') {
            shakeSpecifier = false;
            shakeDeclaration = false;
            break;
          }
          const binding = localPath.scope.bindings[localName];
          if (binding) {
            const refPaths = binding.referencePaths;
            for (const path of refPaths) {
              const unreachable = isPathCertainlyUnreachable(t, path, target);
              if (!unreachable) {
                shakeSpecifier = false;
                shakeDeclaration = false;
              }
            }
          } else {
            // If binding doesn't exist, then this is an indication the import was
            // added by a plugin (rather existing than the original source code)
            // To be conservative, don't shake in this case.
            shakeSpecifier = false;
            shakeDeclaration = false;
          }
          if (shakeSpecifier) {
            specifier.remove();
          }
        }

        if (shakeDeclaration) {
          path.remove();
        }
      },
    },
  };
};

function isLiteralFalse(path) {
  const node = path.node;
  return node.type === 'BooleanLiteral' && node.value === false;
}
function isLiteralTrue(path) {
  const node = path.node;
  return node.type === 'BooleanLiteral' && node.value === true;
}

const inverseTargetMap = {
  node: '__BROWSER__',
  browser: '__NODE__',
};
const opposite = {
  node: 'browser',
  browser: 'node',
};
function isCUPGlobalFalse(path, target) {
  const node = path.node;
  return node.type === 'Identifier' && node.name === inverseTargetMap[target];
}

function isFalse(path, target) {
  return isLiteralFalse(path) || isCUPGlobalFalse(path, target);
}

function isTrue(path, target) {
  return isLiteralTrue(path) || isCUPGlobalFalse(path, opposite[target]);
}

function isPathCertainlyUnreachable(t, path, target) {
  while (path) {
    if (path.parentPath && path.parentPath.type === 'IfStatement') {
      const consquent = path.parentPath.get('consequent');
      const alternate = path.parentPath.get('alternate');
      if (isFalse(path.parentPath.get('test'), target) && consquent === path) {
        return true;
      }
      if (isTrue(path.parentPath.get('test'), target) && alternate === path) {
        return true;
      }
    } else if (path.type === 'ConditionalExpression') {
      if (isFalse(path.get('test'), target)) {
        return true;
      }
    }
    // traverse chained BooleanExpressions
    // to handle cases like: `false && unknown && to_be_shaken`
    let _path = path;
    while (_path) {
      if (
        _path.type === 'LogicalExpression' &&
        _path.get('operator').node === '&&'
      ) {
        _path = _path.get('left');
        if (isFalse(_path, target)) {
          return true;
        }
      } else {
        break;
      }
    }

    path = path.parentPath;
  }
}
