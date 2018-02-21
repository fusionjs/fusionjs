/* eslint-env node */
module.exports = function stripPrefix(req, prefix) {
  if (req.url.indexOf(prefix) === 0) {
    req.url = req.url.slice(prefix.length);
    if (req.url === '') {
      req.url = '/';
    }
  }
};
