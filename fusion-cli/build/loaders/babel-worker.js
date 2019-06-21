/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const PersistentDiskCache = require('../persistent-disk-cache.js');
const TranslationsExtractor = require('../babel-plugins/babel-plugin-i18n');
const path = require('path');
const babel = require('@babel/core');
const getBabelConfig = require('../get-babel-config.js');

module.exports = {
  runTransformation,
};

let cache;

function getCache(cacheDir) {
  if (!cache) {
    cache = new PersistentDiskCache(cacheDir);
  }
  return cache;
}

async function runTransformation(
  source /*: string */,
  inputSourceMap /*: Object */,
  cacheKey /*: string */,
  filename /*: string */,
  loaderOptions /*: Object*/,
  rootContext /*: Object*/,
  sourceMap /*: Object*/
) {
  let newOptions = {
    ...getBabelConfig(loaderOptions.babelConfigData),
    overrides: [],
  };
  let overrides = [];

  if (loaderOptions.overrides != undefined) {
    for (let i = 0; i < loaderOptions.overrides.length; i++) {
      overrides[i] = {
        ...getBabelConfig(loaderOptions.overrides[i]),
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

  const cacheDir = path.join(process.cwd(), 'node_modules/.fusion_babel-cache');

  const diskCache = getCache(cacheDir);
  const result = await diskCache.get(cacheKey, () => {
    let metadata = {};

    let translationIds = new Set();
    // Add the discovery plugin
    // This only does side effects, so it is ok this doesn't affect cache key
    // This plugin is here because webpack config -> loader options
    // requires serialization. But we want to pass translationsIds directly.
    options.plugins.unshift([TranslationsExtractor, {translationIds}]);

    // make the ast
    const ast = babel.parseSync(source, options);
    const transformed = transform(ast, source, options);

    if (translationIds.size > 0) {
      metadata.translationIds = Array.from(translationIds.values());
    }

    if (!transformed) {
      return null;
    }
    let transformations = [];
    transformations[loaderOptions.babelConfigData.target + 'asd'] = {
      metadata,
      ...transformed,
    };
    return {
      ast,
      transformations,
    };
  });

  if (result != null) {
    const {ast, transformations} = result;
    if (transformations[loaderOptions.babelConfigData.target] != undefined) {
      return transformations[loaderOptions.babelConfigData.target];
    } else {
      let metadata = {};
      const transformed = transform(ast, source, options);

      let translationIds = new Set();
      // Add the discovery plugin
      // This only does side effects, so it is ok this doesn't affect cache key
      // This plugin is here because webpack config -> loader options
      // requires serialization. But we want to pass translationsIds directly.
      options.plugins.unshift([TranslationsExtractor, {translationIds}]);

      if (translationIds.size > 0) {
        metadata.translationIds = Array.from(translationIds.values());
      }
      if (!transformed) {
        return null;
      }
      transformations[loaderOptions.babelConfigData.target + 'ASD'] = {
        metadata,
        ...transformed,
      };

      let cacheObj = {
        ast,
        transformations,
      };

      diskCache.put(cacheKey, cacheObj);
      return {
        metadata,
        ...transformed,
      };
      //return transformations[loaderOptions.babelConfigData.target];
    }
  }
  return result;
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
