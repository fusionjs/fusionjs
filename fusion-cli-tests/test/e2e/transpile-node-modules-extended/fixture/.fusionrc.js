module.exports = {
  experimentalTransformTest(modulePath, defaults) {
    if (modulePath.includes('fixture-es2017-pkg')) {
      return 'spec';
    }
    if (modulePath.includes('fixture-macro-pkg')) {
      return 'all';
    }
    return defaults;
  },
  experimentalBundleTest(modulePath, defaults) {
    if (modulePath.includes('fixture-macro-pkg')) {
      return 'universal';
    }
    return defaults;
  }
}
