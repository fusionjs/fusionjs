/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */

const path = require('path');
const loaderUtils = require('loader-utils');

const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const WebWorkerTemplatePlugin = require('webpack/lib/webworker/WebWorkerTemplatePlugin');

class WorkerLoaderError extends Error {
  constructor(err) {
    super(err);

    this.name = err.name || 'Loader Error';
    this.message = `${err.name}\n\n${err.message}\n`;
    /* $FlowFixMe */
    this.stack = false;
  }
}

const getWorker = (file, content, options) => {
  const publicPath = options.publicPath
    ? JSON.stringify(options.publicPath)
    : '__webpack_public_path__';

  const publicWorkerPath = `${publicPath} + ${JSON.stringify(file)}`;

  if (options.inline) {
    const InlineWorkerPath = JSON.stringify(
      `!!${path.join(__dirname, 'InlineWorker.js')}`
    );

    const fallbackWorkerPath =
      options.fallback === false ? 'null' : publicWorkerPath;

    return `require(${InlineWorkerPath})(${JSON.stringify(
      content
    )}, ${fallbackWorkerPath})`;
  }
  return `${publicWorkerPath}`;
};

module.exports = function loader() {};

module.exports.pitch = function(request /* : any*/) {
  const options = loaderUtils.getOptions(this) || {};

  if (!this.webpack) {
    throw new WorkerLoaderError({
      name: 'Worker Loader',
      message: 'This loader is only usable with webpack',
    });
  }

  this.cacheable(false);

  const cb = this.async();

  const filename = loaderUtils.interpolateName(
    this,
    options.name || '[contenthash].worker.js',
    {
      context: options.context || this.rootContext || this.options.context,
      regExp: options.regExp,
    }
  );

  const worker = {};

  worker.options = {
    filename,
    chunkFilename: `[id].${filename}`,
    globalObject: 'self',
    namedChunkFilename: null,
  };

  worker.compiler = this._compilation.createChildCompiler(
    'worker',
    worker.options
  );

  new WebWorkerTemplatePlugin(worker.options).apply(worker.compiler);

  new SingleEntryPlugin(this.context, `!!${request}`, 'main').apply(
    worker.compiler
  );

  const subCache = `subcache ${__dirname} ${request}`;

  worker.compilation = compilation => {
    if (compilation.cache) {
      if (!compilation.cache[subCache]) {
        compilation.cache[subCache] = {};
      }

      compilation.cache = compilation.cache[subCache];
    }
  };

  const plugin = {name: 'WorkerLoader'};
  worker.compiler.hooks.compilation.tap(plugin, worker.compilation);

  worker.compiler.runAsChild((err, entries, compilation) => {
    if (err) return cb(err);

    if (entries[0]) {
      worker.file = entries[0].files[0];

      worker.factory = getWorker(
        worker.file,
        compilation.assets[worker.file].source(),
        options
      );

      if (options.fallback === false) {
        delete this._compilation.assets[worker.file];
      }

      return cb(null, `module.exports = ${worker.factory};\n`);
    }

    return cb(null, null);
  });
};
