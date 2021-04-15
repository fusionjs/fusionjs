/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

const webpack = require('webpack');
const EntryOptionPlugin = require('webpack/lib/EntryOptionPlugin');
const JsonpTemplatePlugin = require('webpack/lib/web/JsonpTemplatePlugin');
/*::

import type {SyncState} from "../shared-state-containers.js";

type Opts = {
  name: string;
  enabledState: SyncState<boolean>,
  entry: Array<any>,
  plugins: Object => Array<any>,
  outputOptions: Object,
};
*/

class ChildCompilationPlugin {
  /*::
  name: string;
  enabledState: SyncState<boolean>;
  entry: Array<string>;
  plugins: Object => Array<any>;
  outputOptions: Object;
  */
  constructor(opts /*: Opts*/) {
    const { entry } = webpack.config.getNormalizedWebpackOptions({
      entry: opts.entry,
    });

    this.name = opts.name;
    this.enabledState = opts.enabledState;
    this.entry = entry;
    this.plugins = opts.plugins;
    this.outputOptions = opts.outputOptions;
  }

  apply(compiler /*: Object*/) {
    const name = this.constructor.name;
    compiler.hooks.make.tapAsync(name, (compilation, callback) => {
      if (this.enabledState.value === false) {
        return void callback();
      }
      const childCompiler = compilation.createChildCompiler(
        this.name,
        this.outputOptions,
        [
          new JsonpTemplatePlugin(),
          ...this.plugins(compilation.options),
        ]
      );
      EntryOptionPlugin.applyEntryOption(childCompiler, compiler.context, this.entry);

      childCompiler.runAsChild((err, entries, childCompilation) => {
        callback(err);
      });
    });
  }
}

module.exports = ChildCompilationPlugin;
