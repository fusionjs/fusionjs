// @flow
const {readFileSync: read, existsSync: exists} = require('fs');
const {execSync: exec} = require('child_process');
const {dirname, basename} = require('path');

const root = process.cwd();
const [node, , main, bin, command, dist, out] = process.argv;

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
  exec(`ln -sf "${target}" "${label}"`, {cwd: `${main}/${dir}`});
});
const {scripts = {}} = JSON.parse(read(`${main}/package.json`, 'utf8'));
const binPath = exists(`${main}/node_modules/.bin`)
  ? `:${main}/node_modules/.bin`
  : '';
const payload = scripts[command] || ``;
const nodeDir = dirname(node);
// prioritize hermetic Node version over system version
const script = `export PATH=${nodeDir}:$PATH${binPath}; ${payload}`;

if (out) {
  exec(`mkdir -p "${dist}"`, {cwd: main});
  exec(script, {cwd: main, env: process.env, stdio: 'inherit'});
  exec(`tar czf "${out}" "${dist}"`, {cwd: main});
} else {
  try {
    exec(script, {cwd: main, env: process.env, stdio: 'inherit'});
  } catch (e) {
    // we don't want the failed `exec` call to print a stack trace to stderr
    // because we are piping the NPM script's stderr to the user
    process.exit(1);
  }
}
