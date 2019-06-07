// @flow
const proc = require('child_process');
const {promisify} = require('util');
const {readFile, writeFile, access, readdir} = require('fs');

const forkQueue = [];

/*::
export type Exec = (string, ExecOptions) => Promise<string>;
export type ExecOptions = void | {
  // https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
  cwd?: string,
  env?: {[string]: ?string},
  encoding?: string,
  shell?: string,
  timeout?: number,
  maxBuffer?: number,
  killSignal?: string | number,
  uid?: number,
  gid?: number,
  windowsHide?:boolean,
};
*/
// use exec if you need stdout as a string, or if you need to explicitly setup shell in some way (e.g. export an env var)
const exec /*: Exec */ = (cmd, opts = {}) => {
  const errorWithSyncStackTrace = new Error(); // grab stack trace outside of promise so errors are easier to narrow down
  return new Promise((resolve, reject) => {
    proc.exec(cmd, opts, (err, stdout, stderr) => {
      if (err) {
        // if we reach ulimit, try again later
        if (err.code === 'EAGAIN') {
          forkQueue.push(() => exec(cmd, opts).then(resolve, reject));
        } else {
          errorWithSyncStackTrace.message = err.message;
          reject(errorWithSyncStackTrace);
        }
      } else {
        resolve(String(stdout));
        const queued = forkQueue.shift();
        if (queued) queued();
      }
    });
  });
};
/*::
import {Writable, Readable, Duplex} from 'stream';

export type Spawn = (string, Array<string>, SpawnOptions) => Promise<void>;
export type SpawnOptions = void | {
  // https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
  cwd?: string,
  env?: {[string]: ?string},
  argv0?: string,
  stdio?: Stdio,
  detached?: boolean,
  uid?: number,
  gid?: number,
  shell?: boolean | string,
  windowsVerbatimArguments?: boolean,
  windowsHide?: boolean,
};
export type Stdio = string | Array<string | number | null | Writable | Readable | Duplex>;
*/
// use spawn if you just need to run a command for its side effects, or if you want to pipe output straight back to the parent shell
const spawn /*: Spawn */ = (cmd, argv, opts) => {
  return new Promise((resolve, reject) => {
    const child = proc.spawn(cmd, argv, opts);
    child.on('error', e => {
      reject(new Error(e));
    });
    child.on('close', code => {
      if (code > 0) {
        reject(new Error(`Process closed with exit code ${code}`));
      }
      resolve();
    });
  });
};

const accessFile = promisify(access);

/*::
export type Exists = (string) => Promise<boolean>
*/
const exists /*: Exists */ = filename =>
  accessFile(filename)
    .then(() => true)
    .catch(() => false);

const read = promisify(readFile);
const write = promisify(writeFile);
const ls = promisify(readdir);

module.exports = {exec, spawn, exists, read, write, ls};
