// @flow
const {
  existsSync: exists,
  readFileSync: read,
  readdirSync: readdir,
  realpathSync: realpath,
} = require('fs');
const {execSync: exec} = require('child_process');
const {dirname, join} = require('path');

const root = process.cwd();
const [node, , main, , command, distPaths, out, ...args] = process.argv;
const dists = distPaths.split('|');

const {scripts = {}} = JSON.parse(read(`${main}/package.json`, 'utf8'));

if (out) {
  runCommands(command, args);
  const dirs = dists.map(dist => `"${dist}"`).join(' ');
  for (const dist of dists) {
    if (!exists(join(main, dist))) {
      exec(`mkdir -p "${dist}"`, {cwd: main});
    }
  }
  exec(`tar czf "${out}" ${dirs}`, {cwd: main});
} else {
  runCommands(command, args);
}

function runCommands(command, args) {
  // we don't want the failed `exec` call to print a stack trace to stderr
  // because we are piping the NPM script's stderr to the user
  if (command.startsWith('yarn ')) {
    runCommand(command.substr(5), args);
    return;
  }
  if (command === 'run') {
    command = args.shift();
  }
  runCommand(scripts[`pre${command}`]);
  runCommand(scripts[command], args);
  runCommand(scripts[`post${command}`]);
}

function runCommand(command, args = []) {
  if (command) {
    const nodeDir = dirname(node);
    const params = args.map(arg => `'${arg}'`).join(' ');
    // prioritize hermetic Node version over system version
    const binPath = `:${root}/node_modules/.bin`;
    if (process.env.NODE_PRESERVE_SYMLINKS) {
      const bins = readdir('node_modules/.bin');
      const items = command.split(' ');
      let matchingBin = null;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (bins.includes(item)) {
          if (
            read(join('node_modules/.bin', item), 'utf-8')
              .split('\n')[0]
              .trim()
              .endsWith('node')
          ) {
            matchingBin = item;
            break;
          }
        }
      }
      if (matchingBin) {
        const realBin = realpath(join('node_modules/.bin', matchingBin));
        let pathToUse = join(
          process.cwd(),
          'node_modules',
          realBin.split('node_modules').pop()
        );

        if (exists(pathToUse)) {
          command = command.replace(
            matchingBin,
            `node --preserve-symlinks-main ${pathToUse}`
          );
        }
      }
    }
    const script = `export PATH=${nodeDir}${binPath}:$PATH; ${command} ${params}`;
    try {
      exec(script, {cwd: main, env: process.env, stdio: 'inherit'});
    } catch (e) {
      process.exit(1);
    }
  }
}
