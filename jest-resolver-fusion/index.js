// @ts-check

/* eslint-env node */

// @flow
const fs = require('fs');
const {ResolverFactory} = require('enhanced-resolve');

const extensions = [
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.node',
];

const nodeResolver = ResolverFactory.createResolver({
  fileSystem: fs,
  useSyncFileSystemCalls: true,
  mainFields: ['main'],
  aliasFields: ['es2015', 'es2017'],
  extensions,
});

module.exports = function enhancedResolve(modulePath, opts) {
  try {
    return nodeResolver.resolveSync({}, opts.basedir, modulePath);
  } catch (err) {
    // Upon failure to resolve, enhanced-resolve throws with a different
    // error message than native Node and no error.code property.
    // This breaks the heuristics of the "bindings" npm library used to
    // locate native code by successively attempting to require potential paths

    // Jest uses the resolver for overloading the native resolution used by
    // the "bindings" libary.

    // So we need to add an error code that "bindings" will recognize,
    // otherwise it will just stop at the first path instead of trying
    // all the possible paths
    // https://github.com/TooTallNate/node-bindings/blob/c8033dcfc04c34397384e23f7399a30e6c13830d/bindings.js#L119
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  }
};
