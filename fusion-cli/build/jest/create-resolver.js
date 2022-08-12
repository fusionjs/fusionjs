// @noflow

/* eslint-env node */

const fs = require('fs');
const {ResolverFactory} = require('enhanced-resolve');

const extensions = ['.js', '.json', '.ts', '.tsx', '.node'];

const nodeResolver = ResolverFactory.createResolver({
  extensions,
  fileSystem: fs,
  useSyncFileSystemCalls: true,
  mainFields: ['main'],
  aliasFields: ['es2015', 'es2017'],
  conditionNames: ['node', 'require'],
});

const browserResolver = ResolverFactory.createResolver({
  extensions,
  fileSystem: fs,
  useSyncFileSystemCalls: true,
  mainFields: ['main'],
  aliasFields: ['browser', 'es2015', 'es2017'],
  conditionNames: ['node', 'require'],
});

// The es5-ext package has files within a '#' directory. Ex. es5-ext/string/#/contains
//
// Enhanced-resolve will escape '#' characters by prefixing with a null terminator '\0'
// https://github.com/webpack/enhanced-resolve/pull/255/files
//
// Webpack will then find instances of this escape pattern and convert back to '#'
// this commit below shows how webpack is transitioning from regex replace to a new
// enhanced-resolve feature that provides an unescaped path.
// https://github.com/webpack/webpack/commit/0197867237cd1ef4c1e13d5fcafc71f4585bff9d
//
// This feature is only available on the async resolve method on Resolver.
// https://github.com/webpack/enhanced-resolve/blob/4b16e4c7ee9fc79f6a544a2018baaedb2f7a340f/lib/Resolver.js#L237
//
// Because this file uses the resolveSync method, the unescaped path is not available,
// it will take the webpack's original approach of regex replace.
function unescapePathFragment(resolverResult) {
  if (typeof resolverResult === 'string') {
    return resolverResult.replace(/\0/g, '');
  }
  return resolverResult;
}

module.exports = function createResolver({browser = false}) {
  return function enhancedResolve(modulePath, opts) {
    try {
      if (browser === true) {
        let browserResult = browserResolver.resolveSync(
          {},
          opts.basedir,
          modulePath
        );
        if (browserResult !== false) {
          return unescapePathFragment(browserResult);
        }
        // Fallback to non-browser field if enhanced-resolve produces `false`.
        // Some packages (e.g. object-inspect) use falsy browser field values to
        // indicate that no browser version exists.
        // This isn't handled by enhanced-resolve.
        // So we simply fall back to resolution without browser field in this case
      }

      const nodeResult = nodeResolver.resolveSync({}, opts.basedir, modulePath);
      return unescapePathFragment(nodeResult);
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
};
