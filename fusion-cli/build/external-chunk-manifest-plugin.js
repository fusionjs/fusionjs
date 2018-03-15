/* eslint-env node */
/**
 * This plugin is equivalent to https://github.com/soundcloud/chunk-manifest-webpack-plugin
 * This version has less cruft and is maintained by us.
 *
 * Main differences:
 * - We don't need to actually generate the manifest here,
 *   since we do this ourselves later on depending on ES2015 bundles
 * - We don't output to files, so we can delete a lot of code
 *
 * So essentially, this plugin just makes it so the global variable is references
 * instead of being hardcoded
 */

class ChunkManifestPlugin {
  constructor(options = {}) {
    this.manifestVariable = options.manifestVariable || '__MANIFEST__';
  }

  apply(compiler) {
    const manifestVariable = this.manifestVariable;
    let oldChunkFilename;

    compiler.hooks.thisCompilation.tap('ChunkManifestPlugin', compilation => {
      compilation.mainTemplate.hooks.requireEnsure.tap(
        'ChunkManifestPlugin',
        function(_) {
          oldChunkFilename = this.outputOptions.chunkFilename;
          this.outputOptions.chunkFilename = '__CHUNK_MANIFEST__';
          return _;
        }
      );
    });

    compiler.hooks.compilation.tap('ChunkManifestPlugin', compilation => {
      compilation.mainTemplate.hooks.requireEnsure.tap(
        'ChunkManifestPlugin',
        function(_, chunk, hash, chunkIdVar) {
          this.outputOptions.chunkFilename = oldChunkFilename;
          return _.replace(
            '"__CHUNK_MANIFEST__"',
            `window["${manifestVariable}"][${chunkIdVar}]`
          );
        }
      );
    });
  }
}

module.exports = ChunkManifestPlugin;
