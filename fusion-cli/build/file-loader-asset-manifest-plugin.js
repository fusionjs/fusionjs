// @flow
/* eslint-env node */
const assetsSingleton = require('./file-loader-asset-storage.js');

class AssetsManifestPlugin {
  // eslint-disable-next-line class-methods-use-this
  apply(compiler /*: any */) {
    const onCompilation = compilation => {
      const additionalAssetsHook = cb => {
        const storage = assetsSingleton.getStorage();
        storage.emittedFiles.forEach(item => {
          // eslint-disable-next-line no-param-reassign
          compilation.assets[item.outputPath] = {
            source: () => item.content,
            size: () => Buffer.byteLength(item.content, 'utf8'),
          };
        });
        cb();
      };

      if (compilation.hooks) {
        compilation.hooks.additionalAssets.tapAsync(
          'AssetsManifestPlugin',
          additionalAssetsHook
        );
      } else {
        compilation.plugin('additional-assets', additionalAssetsHook);
      }
    };

    const onEmit = (compilation, cb) => {
      cb();
    };

    if (compiler.hooks) {
      compiler.hooks.emit.tapAsync('AssetsManifestPlugin', onEmit);
      compiler.hooks.compilation.tap('AssetsManifestPlugin', onCompilation);
    } else {
      compiler.plugin('compilation', onCompilation);
      compiler.plugin('emit', onEmit);
    }
  }
}

module.exports = AssetsManifestPlugin;
