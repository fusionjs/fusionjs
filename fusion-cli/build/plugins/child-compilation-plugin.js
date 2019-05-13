/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin.js');
const JsonpTemplatePlugin = require('webpack/lib/web/JsonpTemplatePlugin.js');
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
    this.name = opts.name;
    this.enabledState = opts.enabledState;
    this.entry = opts.entry;
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
          // "main" is default chunk name for string/array entries, see:
          // https://github.com/webpack/webpack/blob/c2e03951f46bf56397a9b2039309a0c7bbc1991f/lib/EntryOptionPlugin.js#L34
          new MultiEntryPlugin(compiler.context, this.entry, 'main'),
          new JsonpTemplatePlugin(),
          ...this.plugins(compilation.options),
        ]
      );

      childCompiler.runAsChild((err, entries, childCompilation) => {
        callback(err);
      });
    });
  }
}

module.exports = ChildCompilationPlugin;
