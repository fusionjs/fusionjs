/* eslint-env node */

const mime = require('mime');
const getFilenameFromUrl = require('./lib/GetFilenameFromUrl');
const Shared = require('./lib/Shared');
const pathJoin = require('./lib/PathJoin');

// constructor for the middleware
module.exports = function(compiler, options) {
  options = options || {};
  options.filter = options.filter || (() => true);
  const context = {
    state: false,
    options: options,
    compiler: compiler,
  };
  const shared = Shared(context);

  // The middleware function
  function webpackDevMiddleware(req, res, next) {
    function goNext() {
      if (!context.options.serverSideRender) return next();
      shared.waitUntilValid(function() {
        next();
      }, req);
    }

    if (req.method !== 'GET') {
      return goNext();
    }

    let filename = getFilenameFromUrl(
      context.options.publicPath,
      context.compiler.outputPath,
      req.url
    );
    if (filename === false) return goNext();

    shared.handleRequest(filename, processRequest, req);

    function processRequest() {
      try {
        let stat = context.fs.statSync(filename);
        if (!stat.isFile()) {
          if (stat.isDirectory()) {
            filename = pathJoin(
              filename,
              context.options.index || 'index.html'
            );
            stat = context.fs.statSync(filename);
            if (!stat.isFile()) throw 'next';
          } else {
            throw 'next';
          }
        }
      } catch (e) {
        return goNext();
      }

      // server content
      let content = context.fs.readFileSync(filename);
      content = shared.handleRangeHeaders(content, req, res);
      res.setHeader('Access-Control-Allow-Origin', '*'); // To support XHR, etc.
      res.setHeader('Content-Type', mime.getType(filename) + '; charset=UTF-8');
      res.setHeader('Content-Length', content.length);
      if (context.options.headers) {
        for (const name in context.options.headers) {
          res.setHeader(name, context.options.headers[name]);
        }
      }
      res.end(content);
    }
  }

  webpackDevMiddleware.getFilenameFromUrl = getFilenameFromUrl.bind(
    this,
    context.options.publicPath,
    context.compiler.outputPath
  );
  webpackDevMiddleware.waitUntilValid = shared.waitUntilValid;
  webpackDevMiddleware.fileSystem = context.fs;
  return webpackDevMiddleware;
};
