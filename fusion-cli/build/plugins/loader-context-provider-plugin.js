/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/*eslint-env node */

class LoaderContextProviderPlugin /*::<T>*/ {
  /*::
  value: T;
  loaderContextKey: any;
  */
  constructor(key /*:any*/, value /*: T*/) {
    this.loaderContextKey = key;
    this.value = value;
  }
  apply(compiler /*: Object */) {
    const name = this.constructor.name;
    compiler.hooks.compilation.tap(name, compilation => {
      compilation.hooks.normalModuleLoader.tap(name, (context, module) => {
        context[this.loaderContextKey] = this.value;
      });
    });
  }
}

module.exports = LoaderContextProviderPlugin;
