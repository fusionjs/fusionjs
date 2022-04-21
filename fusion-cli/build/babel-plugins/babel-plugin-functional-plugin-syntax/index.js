/* @flow */
/* eslint-env node */

const createNamedModuleVisitor = require('../babel-plugin-utils/visit-named-module');
const {addNamed} = require('@babel/helper-module-imports');

const PURE_ANNOTATION = '#__PURE__';

const yieldHooks = new Set(['withDeps', 'withPlugin', 'withStartup']);

const nodeOnlyHooks = new Set([
  'withMiddleware',
  'withSSREffect',
  'withEndpoint',
]);

const hooks = [
  ...yieldHooks,
  ...nodeOnlyHooks,
  'withRenderSetup',
  'withUniversalMiddleware',
  'withUniversalValue',
];

module.exports = pureCreatePlugin;

function pureCreatePlugin(babel /*: Object */) {
  const t = babel.types;
  const visitor = createNamedModuleVisitor(
    t,
    hooks,
    'fusion-core',
    refsHandler
  );
  return {
    visitor: {
      ...visitor,
      Program: {
        enter(path /*: any */, state /*: any */) {
          // Track functions that need to be transformed
          state.pluginFunctions = new Set();
        },
        exit(path /*: any */, state /*: any */) {
          for (var pluginPath of state.pluginFunctions) {
            addPluginDeclaration(t, pluginPath, state);
          }
        },
      },
    },
  };
}

function refsHandler(t, state, refs = []) {
  // Iterate in reverse as refs so we move up tree in nested cases
  let i = refs.length;
  while (i--) {
    const refPath = refs[i];
    const name = refPath.node.name;
    const path = refPath.parentPath;

    let hookPath = path;
    if (name === 'withPlugin') {
      hookPath = assertWithPlugin(t, refPath);
    } else if (!t.isCallExpression(path)) {
      throw path.buildCodeFrameError(`${name} hook must be invoked`);
    }

    const fnParent = path.getFunctionParent();

    if (!fnParent) {
      throw path.buildCodeFrameError(
        `${name} hook must be invoked within a function`
      );
    }

    // If originally written as generator syntax already, we do not want inject yield expressions
    if (!fnParent.node.generator) {
      if (yieldHooks.has(name)) {
        hookPath.replaceWith(t.yieldExpression(hookPath.node));
      }
    }
    if (nodeOnlyHooks.has(name)) {
      path.replaceWith(
        t.conditionalExpression(
          t.identifier('__NODE__'),
          path.node,
          t.unaryExpression('void', t.numericLiteral(0))
        )
      );
    }

    state.pluginFunctions.add(fnParent);
  }
}

function addPluginDeclaration(t, fnPath, state) {
  if (!state.importId) {
    state.importId = addNamed(fnPath, 'declarePlugin', 'fusion-core');
  }

  if (t.isArrowFunctionExpression(fnPath)) {
    fnPath.arrowFunctionToExpression({});
  }

  fnPath.node.generator = true;

  if (!fnPath.instrumented) {
    fnPath.instrumented = true;
    if (fnPath.isFunctionDeclaration()) {
      // esbuild treats assignment as non-pure so assigning a magic property
      // would prevent tree shaking of unused plugins
      // https://github.com/evanw/esbuild/issues/2010
      // Instead, we convert function decalarations to hoisted function expressions
      const declaration = t.variableDeclaration('var', [
        t.variableDeclarator(
          fnPath.node.id,
          t.addComment(
            t.callExpression(state.importId, [t.toExpression(fnPath.node)]),
            'leading',
            PURE_ANNOTATION
          )
        ),
      ]);
      // Adapted from from @babel/plugin-transform-block-scoped-functions
      // https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-block-scoped-functions/src/index.js#L19
      declaration._blockHoist = 2;
      fnPath.replaceWith(declaration);
    } else {
      fnPath.replaceWith(
        t.addComment(
          t.callExpression(state.importId, [fnPath.node]),
          'leading',
          PURE_ANNOTATION
        )
      );
    }
    fnPath.skip();
  }
}

function assertWithPlugin(t, path) {
  let currentPath = path;
  while (currentPath) {
    const parentPath = currentPath.parentPath;
    if (t.isCallExpression(parentPath)) {
      break;
    } else if (
      t.isMemberExpression(parentPath) &&
      parentPath.node.property.name === 'using' &&
      t.isCallExpression(parentPath.parentPath)
    ) {
      currentPath = currentPath.parentPath.parentPath;
      continue;
    } else {
      throw parentPath.buildCodeFrameError('withPlugin must be invoked');
    }
  }
  return currentPath.parentPath;
}
