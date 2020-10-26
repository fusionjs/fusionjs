// @flow
const proc = require('child_process');
const {promisify} = require('util');
const {tmpdir} = require('os');
const {
  readFile,
  writeFile,
  access,
  readdir,
  mkdir: makeDir,
  lstat,
  realpath,
} = require('fs');

/*::
import {Writable, Readable, Duplex} from 'stream';

export type Exec = (string, ExecOptions, ?StdioOptions) => Promise<string>;
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
export type StdioOptions = Array<Writable>;
*/
// use exec if you need stdout as a string, or if you need to explicitly setup shell in some way (e.g. export an env var)
const exec /*: Exec */ = (cmd, opts = {}, stdio = []) => {
  const errorWithSyncStackTrace = new Error(); // grab stack trace outside of promise so errors are easier to narrow down
  return new Promise((resolve, reject) => {
    const child = proc.exec(cmd, opts, (err, stdout, stderr) => {
      if (err) {
        errorWithSyncStackTrace.message = err.message;
        reject(errorWithSyncStackTrace);
      } else {
        resolve(String(stdout));
      }
      process.off('exit', onExit);
    });
    if (stdio) {
      if (stdio[0]) child.stdout.pipe(stdio[0]);
      if (stdio[1]) child.stderr.pipe(stdio[1]);
    }

    function onExit() {
      // $FlowFixMe flow typedef is missing .exitCode
      if (child.exitCode === null) child.kill();
    }

    process.on('exit', onExit);
  });
};

/*::
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
  const errorWithSyncStackTrace = new Error();
  return new Promise((resolve, reject) => {
    const child = proc.spawn(cmd, argv, opts);
    child.on('error', e => {
      reject(new Error(e));
    });
    child.on('close', code => {
      if (code > 0) {
        const args = argv.join(' ');
        const cwd = opts && opts.cwd ? `at ${opts.cwd} ` : '';
        errorWithSyncStackTrace.message = `Process failed ${cwd}with exit code ${code}: ${cmd} ${args}`;
        // $FlowFixMe - maybe create specific error class to contain exit code?
        errorWithSyncStackTrace.status = code;
        reject(errorWithSyncStackTrace);
      }
      resolve();
    });
    process.on('exit', () => {
      // $FlowFixMe flow typedef is missing .exitCode
      if (child.exitCode === null) child.kill();
    });
  });
};

const accessFile = promisify(access);

/*::
export type Exists = (string) => Promise<boolean>;
*/
const exists /*: Exists */ = filename =>
  accessFile(filename)
    .then(() => true)
    .catch(() => false);

const read = promisify(readFile);
const write = promisify(writeFile);
const ls = promisify(readdir);
const mkdir = promisify(makeDir);
const lstatP = promisify(lstat);
const realpathP = promisify(realpath);

/*::
export type Move = (string, string) => Promise<void>
*/
const move /*: Move */ = async (from, to) => {
  await spawn('mv', [from, to]); // fs.rename can't move across devices/partitions so it can die w/ EXDEV error
};

/*::
export type Remove = (string) => Promise<void>;
*/
const remove /*: Remove */ = async dir => {
  const tmp = `${tmpdir()}/${Math.random() * 1e17}`;
  // $FlowFixMe flow can't handle statics of async function
  const fork = remove.fork;
  if (await exists(dir)) {
    await exec(`mkdir -p ${tmp} && mv ${dir} ${tmp}`);
    const child = proc.spawn('rm', ['-rf', tmp], {
      detached: fork,
      stdio: 'ignore',
    });
    if (fork) child.unref();
  }
};
// $FlowFixMe flow can't handle statics of async function
remove.fork = true;

module.exports = {
  exec,
  spawn,
  exists,
  read,
  write,
  remove,
  ls,
  mkdir,
  move,
  lstat: lstatP,
  realpath: realpathP,
};
