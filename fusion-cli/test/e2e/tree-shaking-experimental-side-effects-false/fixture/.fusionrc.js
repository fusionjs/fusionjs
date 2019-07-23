module.exports = {
  experimentalSideEffectsTest: (request, defaults) => {
    if (request.includes('node_modules/side-effects-false-pkg')) {
      return defaults
    }
    return false
  }
};
