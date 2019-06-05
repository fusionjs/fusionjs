// @flow
const proc = require('child_process');
const {promisify} = require('util');
const {readFile, writeFile, access, readdir} = require('fs');

const forkQueue = [];

// use exec if you need stdout as a string, or if you need to explicitly setup shell in some way (e.g. export an env var)
const exec = (cmd, opts = {}) => {
  const errorWithSyncStackTrace = new Error(); // grab stack trace outside of promise so errors are easier to narrow down
  return new Promise((resolve, reject) => {
    proc.exec(cmd, opts, (err, stdout, stderr) => {
      if (err) {
        // if we reach ulimit, try again later
        if (err.code === 'EAGAIN') {
          forkQueue.push(() => exec(cmd, opts).then(resolve, reject));
        } else {
          errorWithSyncStackTrace.message = err;
          reject(errorWithSyncStackTrace);
        }
      } else {
        resolve(stdout);
        const queued = forkQueue.shift();
        if (queued) queued();
      }
    });
  });
};
// use spawn if you just need to run a command for its side effects, or if you want to pipe output straight back to the parent shell
const spawn = (cmd, argv, opts) => {
  return new Promise((resolve, reject) => {
    const child = proc.spawn(cmd, argv, opts);
    child.on('error', e => {
      reject(new Error(e));
    });
    child.on('close', code => {
      resolve();
    });
  });
};
const accessFile = promisify(access);
const exists = filename =>
  accessFile(filename)
    .then(() => true)
    .catch(() => false);
const read = promisify(readFile);
const write = promisify(writeFile);
const ls = promisify(readdir);

const ensure = fn => ({
  async catch(error) {
    try {
      return await fn();
    } catch (e) {
      const err = new Error(error);
      err.stack = e.stack;
      throw err;
    }
  },
});

module.exports = {exec, spawn, exists, read, write, ls, ensure};
