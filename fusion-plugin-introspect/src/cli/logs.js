// @flow
module.exports.logs = (fn /*: Function */) => async (...args /*: mixed */) => {
  // eslint-disable-next-line
  console.log(await fn(...args));
};
