module.exports = {
  experimentalCompileTest(modulePath, defaults) {
    if (modulePath.includes('fixture-es2017-pkg')) {
      return {
        bundle: 'browser-only',
        transform: 'spec',
      }
    }
    if (modulePath.includes('fixture-macro-pkg')) {
      return {
        bundle: 'universal',
        transform: 'all',
      };
    }
    return defaults;
  }
}