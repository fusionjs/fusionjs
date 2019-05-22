module.exports = {
  experimentalCompileTest(modulePath, defaults) {
    if (modulePath.includes('fixture-es2017-pkg')) {
      return {
        bundle: 'client',
        transpile: 'spec',
      }
    }
    if (modulePath.includes('fixture-macro-pkg')) {
      return {
        bundle: 'both',
        transpile: 'all',
      };
    }
    return defaults;
  }
}