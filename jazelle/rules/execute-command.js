// @flow
const {readFileSync: read} = require('fs');
const {execSync: exec} = require('child_process');
const {dirname} = require('path');

const root = process.cwd();
const [node, , main, , command, distPaths, out, ...args] = process.argv;
const dists = distPaths.split('|');

const {scripts = {}} = JSON.parse(read(`${main}/package.json`, 'utf8'));

if (out) {
  for (const dist of dists) {
    exec(`mkdir -p "${dist}"`, {cwd: main});
  }
  runCommands(command, args);
  const dirs = dists.map(dist => `"${dist}"`).join(' ');
  exec(`tar czf "${out}" ${dirs}`, {cwd: main});
} else {
  runCommands(command, args);
}

function runCommands(command, args) {
  // we don't want the failed `exec` call to print a stack trace to stderr
  // because we are piping the NPM script's stderr to the user
  try {
    if (command === 'run') {
      command = args.shift();
    }
    runCommand(`pre${command}`);
    runCommand(command, args);
    runCommand(`post${command}`);
  } catch (e) {
    process.exit(1);
  }
}

function runCommand(command, args = []) {
  if (scripts[command]) {
    const payload = scripts[command];
    const nodeDir = dirname(node);
    const params = args.map(arg => `'${arg}'`).join(' ');

    // prioritize hermetic Node version over system version
    const binPath = `:${root}/node_modules/.bin`;
    const script = `export NODE_PRESERVE_SYMLINKS=1; export PATH=${nodeDir}${binPath}:$PATH; ${payload} ${params}`;
    exec(script, {cwd: main, env: process.env, stdio: 'inherit'});
  }
}
