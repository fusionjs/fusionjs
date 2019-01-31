// @flow
/* eslint-env node */
const loader = require('graphql-tag/loader');

module.exports = {
  process(src /* : string */) {
    // call directly the webpack loader with a mocked context
    // as graphql-tag/loader leverages `this.cacheable()`
    return loader.call({cacheable() {}}, src);
  },
};
