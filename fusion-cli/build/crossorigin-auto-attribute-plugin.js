/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

/**
 * There's an outstanding bug with Safari where (in violation of the spec)
 * it doesn't send cookies for script tags with crossorigin="anonymous" attributes,
 * even when the source url is same-origin.
 *
 * See:
 * - https://bugs.webkit.org/show_bug.cgi?id=171566
 * - https://bugs.webkit.org/show_bug.cgi?id=171550
 *
 * As a result of this, any chunks loaded by webpack will fail in Safari
 * if they require cookies to be sent (because webpack uses crossorigin="anonymous").
 *
 * This plugin ensures that the crossorigin attribute is omitted if the script
 * src matches the page origin.
 *
 * Note: `script.src` accesses the `src` property
 * (as opposed to attribute) which yields an absolute URL per HTML5 spec
 */

class CrossoriginAutoAttributePlugin {
  apply(compiler /*: any */) {
    compiler.hooks.compilation.tap('CrossoriginAutoAttributePlugin', function(
      compilation
    ) {
      compilation.mainTemplate.hooks.jsonpScript.tap(
        'JsonpMainTemplatePlugin',
        source => {
          return source.replace(
            /script\.src = [^;]*;/,
            '$& if (!script.src.indexOf(window.location.origin)) {script.crossOrigin = void 0;}'
          );
        }
      );
    });
  }
}
module.exports = CrossoriginAutoAttributePlugin;
