/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const TranslationsExtractor = require('../babel-plugins/babel-plugin-i18n');
const path = require('path');
const babel = require('@babel/core');
const getBabelConfig = require('../get-babel-config.js');

module.exports = {
  runTransformation,
};

async function runTransformation(
  source /*: string */,
  inputSourceMap /*: Object */,
  cacheKey /*: string */,
  filename /*: string */,
  rootContext /*: Object*/,
  sourceMap /*: Object*/,
  babelOptions /*: Object*/,
  optionsName /*: String*/
) {
  let ast = void 0;
  let transformations = {};

  for (var property in babelOptions) {
    let newOptions = {
      ...getBabelConfig(babelOptions[property]),
      overrides: [],
    };
    let overrides = [];

    if (babelOptions[property].overrides != undefined) {
      for (let i = 0; i < babelOptions[property].overrides.length; i++) {
        overrides[i] = {
          ...getBabelConfig(babelOptions[property].overrides[i]),
        };
      }
    }
    newOptions.overrides = overrides;

    const config = babel.loadPartialConfig({
      ...newOptions,
      filename,
      sourceRoot: rootContext,
      sourceMap: sourceMap,
      inputSourceMap: inputSourceMap || void 0,
      sourceFileName: relative(rootContext, filename),
    });
    const options = config.options;

    if (ast == void 0) {
      ast = babel.parseSync(source, options);
    }

    let metadata = {};

    let translationIds = new Set();
    // Add the discovery plugin
    // This only does side effects, so it is ok this doesn't affect cache key
    // This plugin is here because webpack config -> loader options
    // requires serialization. But we want to pass translationsIds directly.
    options.plugins.unshift([TranslationsExtractor, {translationIds}]);

    let transformed = transform(ast, source, options);

    if (translationIds.size > 0) {
      metadata.translationIds = Array.from(translationIds.values());
    }

    transformations[optionsName] = {
      metadata,
      ...transformed,
    };
  } // END LOOP
  if (0 == Object.keys(transformations).length) {
    return null;
  }
  return transformations;
}

function transform(ast, source, options) {
  let result;
  try {
    result = babel.transformFromAst(ast, source, options);
  } catch (err) {
    throw err.message && err.codeFrame ? new LoaderError(err) : err;
  }

  if (!result) return null;

  // We don't return the full result here because some entries are not
  // really serializable. For a full list of properties see here:
  // https://github.com/babel/babel/blob/master/packages/babel-core/src/transformation/index.js
  // For discussion on this topic see here:
  // https://github.com/babel/babel-loader/pull/629
  const {code, map, sourceType} = result;

  if (map && (!map.sourcesContent || !map.sourcesContent.length)) {
    map.sourcesContent = [source];
  }

  return {code, map, sourceType};
}

class LoaderError extends Error {
  /*::
  hideStack: boolean
  */
  constructor(err) {
    super();
    const {name, message, codeFrame, hideStack} = formatError(err);
    this.name = 'BabelLoaderError';
    this.message = `${name ? `${name}: ` : ''}${message}\n\n${codeFrame}\n`;
    this.hideStack = hideStack;
    Error.captureStackTrace(this, this.constructor);
  }
}

const STRIP_FILENAME_RE = /^[^:]+: /;

function formatError(err) {
  if (err instanceof SyntaxError) {
    err.name = 'SyntaxError';
    err.message = err.message.replace(STRIP_FILENAME_RE, '');
    err.hideStack = true;
  } else if (err instanceof TypeError) {
    err.name = null;
    err.message = err.message.replace(STRIP_FILENAME_RE, '');
    err.hideStack = true;
  }
  return err;
}

function relative(root, file) {
  const rootPath = root.replace(/\\/g, '/').split('/')[1];
  const filePath = file.replace(/\\/g, '/').split('/')[1];
  // If the file is in a completely different root folder
  // use the absolute path of the file
  if (rootPath && rootPath !== filePath) {
    return file;
  }
  return path.relative(root, file);
}
