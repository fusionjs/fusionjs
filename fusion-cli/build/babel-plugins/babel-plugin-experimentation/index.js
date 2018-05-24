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

const PACKAGE_NAME = [
  'fusion-plugin-experimentation-react',
  'fusion-plugin-experimentation-preact',
];

const COMPONENT_IDENTIFIER = ['withExperiment'];

const EXPERIMENTATION_KEY = Symbol(
  '@uber/babel-plugin-experimentation experimentation state'
);

const chunkImportTemplate = template(
  `import { chunkId as LOCAL_ID } from 'fusion-core';`,
  {
    sourceType: 'module',
  }
);

const fileChunkIdTemplate = template(`const CHUNKIDS_ID = LOCAL_ID(FILENAME);`);

// TODO(#4): There might be some issues related to npm module tree resolution here.
// How can we ensure that the fusion-experimentation instance imported here and elsewhere are the same?
const singletonImport = template(
  `
    import { nodeSingleton as LOCAL_SINGLETON } from 'fusion-experimentation';
  `,
  {sourceType: 'module'}
);

const builder = template(
  `
    LOCAL_SINGLETON.add(FILENAME, CHUNKIDS_ID, EXPERIMENTS);

    if (module.hot) {
      module.hot.dispose(() => {
        LOCAL_SINGLETON.dispose(FILENAME, CHUNKIDS_ID, EXPERIMENTS);
      });
    }

  `,
  {sourceType: 'module'}
);

/**
 * Appends a node to the program body and returns the path of the inserted node
 */
function appendToBody(programPath, node) {
  programPath.pushContainer('body', node);
  const bodyPath = programPath.get('body');
  return bodyPath[bodyPath.length - 1];
}

module.exports = function experimentationPlugin(babel /*: Object */) {
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
        Object.defineProperty(state, EXPERIMENTATION_KEY, {
          value: new Set(),
        });
      },
      exit(path, state) {
        const experiments = state[EXPERIMENTATION_KEY];
        if (experiments.size > 0) {
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

          const experimentationId = path.scope.generateUidIdentifier(
            'experimentation'
          );

          path.scope.push({
            id: experimentationId,
            init: t.arrayExpression(
              Array.from(experiments).map(key => t.stringLiteral(key))
            ),
          });

          if (!state.importedPackageName) {
            throw path.buildCodeFrameError(
              'Experimentation HOC has to be imported from one of the following packages: fusion-plugin-experimentation-react, fusion-plugin-experimentation-preact'
            );
          }
          const localSingleton = path.scope.generateUidIdentifier('singleton');
          path.pushContainer(
            'body',
            singletonImport({
              LOCAL_SINGLETON: localSingleton,
            })
          );
          path.pushContainer(
            'body',
            builder({
              CHUNKIDS_ID: CHUNKIDS_ID,
              EXPERIMENTS: experimentationId,
              LOCAL_SINGLETON: localSingleton,
              FILENAME: filenameLiteral,
            })
          );
        }
      },
    },
  };

  return {visitor: Object.assign({}, visitor, programVisitor)};
};

function refsHandler(t, context, refs = []) {
  refs.forEach(refPath => {
    if (t.isCallExpression(refPath.parent)) {
      const firstArg = refPath.parent.arguments[0];
      const errorMessage =
        'The withExperiment hoc must be called with an object with `experimentName` and `onError`';
      if (!t.isObjectExpression(firstArg)) {
        throw new Error(errorMessage);
      }
      const properties = firstArg.properties;

      let calledWithName = false;
      let calledWithOnError = false;
      properties.forEach(property => {
        if (!t.isObjectProperty(property)) {
          throw new Error(errorMessage);
        }
        if (
          property.key.name === 'experimentName' &&
          t.isStringLiteral(property.value)
        ) {
          calledWithName = true;
          context[EXPERIMENTATION_KEY].add(property.value.value);
        }
        if (property.key.name === 'onError') {
          calledWithOnError = true;
        }
      });

      if (!calledWithName || !calledWithOnError) {
        throw new Error(errorMessage);
      }
    }
  });
}
