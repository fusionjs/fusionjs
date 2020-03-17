// @flow
const {readFileSync: read} = require('fs');
const {execSync: exec} = require('child_process');
const {dirname, basename} = require('path');

const root = process.cwd();
const [node, , main, bin, command, distPaths, out, ...args] = process.argv;
const dists = distPaths.split('|');

const files = exec(`find . -name output.tgz`, {cwd: bin, encoding: 'utf8'})
  .split('\n')
  .filter(Boolean);
files.map(f => {
  const target = `${root}/${dirname(f)}`;
  exec(`tar xzf "${f}" -C "${target}"`, {cwd: bin});

  const {name} = JSON.parse(read(`${target}/package.json`, 'utf8'));
  const label = basename(name);
  const dir = dirname(`node_modules/${name}`);
  exec(`mkdir -p ${dir}`, {cwd: main});
  exec(`ln -sfn "${target}" "${label}"`, {cwd: `${main}/${dir}`});
});
const {scripts = {}} = JSON.parse(read(`${main}/package.json`, 'utf8'));

if (out) {
  for (const dist of dists) {
    exec(`mkdir -p "${dist}"`, {cwd: main});
  }
  runCommands();
  const dirs = dists.map(dist => `"${dist}"`).join(' ');
  exec(`tar czf "${out}" ${dirs}`, {cwd: main});
} else {
  try {
    runCommands();
  } catch (e) {
    // we don't want the failed `exec` call to print a stack trace to stderr
    // because we are piping the NPM script's stderr to the user
    process.exit(1);
  }
}

function runCommands() {
  runCommand(`pre${command}`);
  runCommand(command, args);
  runCommand(`post${command}`);
}

function runCommand(command, args = []) {
  if (command === 'run') {
    command = args.shift();
  }
  if (scripts[command]) {
    const payload = scripts[command];
    const nodeDir = dirname(node);
    const params = args.map(arg => `'${arg}'`).join(' ');

    // prioritize hermetic Node version over system version
    const binPath = `:${root}/node_modules/.bin`;
    const script = `export PATH=${nodeDir}${binPath}:$PATH; ${payload} ${params}`;
    exec(script, {cwd: main, env: process.env, stdio: 'inherit'});
  }
}
