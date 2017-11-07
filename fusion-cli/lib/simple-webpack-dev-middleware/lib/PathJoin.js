/* eslint-env node */

function pathJoin(a, b) {
  return a == '/' ? '/' + b : (a || '') + '/' + b;
}

module.exports = pathJoin;
