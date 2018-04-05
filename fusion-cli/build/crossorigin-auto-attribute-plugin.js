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
 * This plugin ensures that the crossorigin attribute is omitted
 * unless the script src begins with `https://`.
 *
 * Note: if for some reason an absolute path is used even for same-origin scripts,
 * cookies may be erronously not be sent in Safari.
 */

class CrossoriginAutoAttributePlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('CrossoriginAutoAttributePlugin', function(
      compilation
    ) {
      compilation.mainTemplate.hooks.jsonpScript.tap(
        'JsonpMainTemplatePlugin',
        source => {
          return source.replace(
            /script\.src = [^;]*;/,
            '$& if (!script.src.match(/^https:\\/\\//)) {script.crossOrigin = void 0;}'
          );
        }
      );
    });
  }
}
module.exports = CrossoriginAutoAttributePlugin;
