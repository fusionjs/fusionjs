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
let {getTransformDefault} = require('../get-webpack-config.js');
const loadFusionRC = require('../load-fusionrc.js');

module.exports = {
  runTransformation,
};

/*::
type TransformationMetadata = {
  translationIds: string[]
};
*/

const JS_EXT_PATTERN = /\.(mjs|js|jsx)$/;

async function runTransformation(
  source /*: string */,
  inputSourceMap /*: Object */,
  filename /*: string */,
  loaderOptions /*: Object*/,
  rootContext /*: Object*/,
  sourceMap /*: Object*/
) {
  let newOptions = {
    ...getBabelConfigFromCache(
      rootContext,
      loaderOptions.configCacheKey,
      loaderOptions.babelConfigData
    ),
    overrides: [],
  };

  if (loaderOptions.overrides != undefined) {
    for (let i = 0; i < loaderOptions.overrides.length; i++) {
      let override = getBabelConfigFromCache(
        rootContext,
        loaderOptions.overrideCacheKey,
        loaderOptions.overrides[i]
      );
      //$FlowFixMe
      override.test = modulePath => {
        if (!JS_EXT_PATTERN.test(modulePath)) {
          return false;
        }

        const experimentalTransformTest = getExperimentalTransformTest(
          rootContext
        );
        const defaultTransform = getTransformDefault(modulePath, rootContext);
        const transform = experimentalTransformTest
          ? experimentalTransformTest(modulePath, defaultTransform)
          : defaultTransform;
        if (transform === 'none' || transform === 'spec') {
          return false;
        } else if (transform === 'all') {
          return true;
        } else {
          throw new Error(
            `Unexpected value from experimentalTransformTest ${transform}. Expected 'spec' | 'all' | 'none'`
          );
        }
      };
      newOptions.overrides.push(override);
    }
  }

  const config = babel.loadPartialConfig({
    ...newOptions,
    filename,
    sourceRoot: rootContext,
    sourceMap: sourceMap,
    inputSourceMap: inputSourceMap || void 0,
    sourceFileName: relative(rootContext, filename),
  });

  const options = config.options;

  let metadata/*: TransformationMetadata*/ = {};

  let translationIds = new Set();
  // Add the discovery plugin
  // This only does side effects, so it is ok this doesn't affect cache key
  // This plugin is here because webpack config -> loader options
  // requires serialization. But we want to pass translationsIds directly.
  options.plugins.unshift([TranslationsExtractor, {translationIds}]);

  const transformed = transform(source, options);

  if (translationIds.size > 0) {
    metadata.translationIds = Array.from(translationIds);
  }

  if (!transformed) {
    return null;
  }

  return {metadata, ...transformed};
}

function transform(source, options) {
  let result;
  try {
    result = babel.transformSync(source, options);
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

let babelConfigCache = {};
function getBabelConfigFromCache(path, uid, data) {
  if (babelConfigCache[uid]) return babelConfigCache[uid];
  const customConfig = getCustomBabelConfig(path);
  const config = getBabelConfig({
    ...data,
    plugins: customConfig.plugins,
    presets: customConfig.presets,
  });
  babelConfigCache[uid] = config;
  return config;
}

let loaded = false,
  savedConfig;
function getFusionRC(path) {
  if (!loaded) {
    const config = loadFusionRC(path, true);
    savedConfig = config;
    loaded = true;
  }
  return savedConfig;
}
function getExperimentalTransformTest(path) {
  return getFusionRC(path).experimentalTransformTest;
}
function getCustomBabelConfig(path) {
  return getFusionRC(path).babel || {};
}
