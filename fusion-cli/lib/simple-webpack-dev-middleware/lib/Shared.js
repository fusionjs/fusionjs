/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

const parseRange = require('range-parser');
const pathIsAbsolute = require('path-is-absolute');
const MemoryFileSystem = require('memory-fs');

const HASH_REGEXP = /[0-9a-f]{10,}/;
const EventEmitter = require('events');

module.exports = function Shared(context /*: any */) {
  const emitter = new EventEmitter();
  const share = {
    handleRangeHeaders: function handleRangeHeaders(
      content /*: any */,
      req /*: any */,
      res /*: any */
    ) {
      //assumes express API. For other servers, need to add logic to access alternative header APIs
      res.setHeader('Accept-Ranges', 'bytes');
      if (req.headers.range) {
        const ranges = parseRange(content.length, req.headers.range);

        // unsatisfiable
        if (-1 == ranges) {
          res.setHeader('Content-Range', 'bytes */' + content.length);
          res.statusCode = 416;
        }

        // valid (syntactically invalid/multiple ranges are treated as a regular response)
        if (-2 != ranges && ranges.length === 1) {
          // Content-Range
          res.statusCode = 206;
          const length = content.length;
          res.setHeader(
            'Content-Range',
            'bytes ' + ranges[0].start + '-' + ranges[0].end + '/' + length
          );

          content = content.slice(ranges[0].start, ranges[0].end + 1);
        }
      }
      return content;
    },
    setFs: function(compiler /*: any */) {
      if (
        typeof compiler.outputPath === 'string' &&
        !pathIsAbsolute.posix(compiler.outputPath) &&
        !pathIsAbsolute.win32(compiler.outputPath)
      ) {
        throw new Error('`output.path` needs to be an absolute path or `/`.');
      }

      // store our files in memory
      let fs;
      function setFs(c) {
        // fs is already memory
        if (c.outputFileSystem instanceof MemoryFileSystem) {
          return;
        }
        if (!fs) {
          fs = new MemoryFileSystem();
        }
        c.outputFileSystem = fs;
      }

      if (compiler.compilers) {
        compiler.compilers.filter(context.options.filter).forEach(setFs);
        if (!fs) {
          if (compiler.compilers.length) {
            // use first filesystem
            fs = compiler.compilers[0].outputFileSystem;
          } else {
            throw new Error('No MultiCompiler output file system found');
          }
        }
      } else {
        setFs(compiler);
        if (!fs) {
          fs = compiler.outputFileSystem;
        }
      }
      context.fs = fs;
    },
    compilerDone: function() {
      // We are now on valid state
      context.state = true;
      emitter.emit('ready');
    },
    compilerInvalid: function() {
      // We are now in invalid state
      context.state = false;
      //resolve async
      if (arguments.length === 2 && typeof arguments[1] === 'function') {
        const callback = arguments[1];
        callback();
      }
    },
    handleRequest: function(
      filename /*: string */,
      processRequest /*: () => any */
    ) {
      if (HASH_REGEXP.test(filename)) {
        try {
          if (context.fs.statSync(filename).isFile()) {
            processRequest();
            return;
          }
        } catch (e) {
          // do nothing
        }
      }
      share.waitUntilValid(processRequest);
    },
    waitUntilValid: function(callback /*: () => any */) {
      if (context.state) {
        return callback();
      }
      emitter.once('ready', callback);
    },
  };
  share.setFs(context.compiler);

  context.compiler.hooks.done.tap('Shared', share.compilerDone);
  context.compiler.hooks.invalid.tap('Shared', share.compilerInvalid);
  context.compiler.hooks.watchRun.tap('Shared', share.compilerInvalid);
  context.compiler.hooks.run.tap('Shared', share.compilerInvalid);

  return share;
};
