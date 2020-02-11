// @flow
const {resolve, relative, basename} = require('path');
const {getManifest} = require('../utils/get-manifest.js');
const {spawn, exists, read, write} = require('../utils/node-helpers.js');
const {executeHook} = require('../utils/execute-hook.js');
const {align} = require('./align.js');

/*::
type ScaffoldArgs = {
  root: string,
  cwd: string,
  from: string,
  to: string,
  name?: string,
};
type Scaffold = (ScaffoldArgs) => Promise<void>
*/
const scaffold /*: Scaffold */ = async ({root, cwd, from, to, name}) => {
  const manifest = /*:: await */ await getManifest({root});
  const {hooks} = manifest;

  const absoluteFrom = resolve(cwd, from);
  const absoluteTo = resolve(cwd, to);
  const relativeFrom = relative(root, absoluteFrom);
  const relativeTo = relative(root, absoluteTo);

  await spawn('cp', ['-r', absoluteFrom, absoluteTo]);

  if (hooks) await executeHook(hooks.prescaffold, absoluteTo);

  const metaFile = `${absoluteTo}/package.json`;
  const meta = JSON.parse(await read(metaFile, 'utf8'));
  meta.name = name || basename(relativeTo);
  await write(metaFile, JSON.stringify(meta, null, 2), 'utf8');

  const buildFile = `${absoluteTo}/BUILD.bazel`;
  if (await exists(buildFile)) {
    const build = await read(buildFile, 'utf8');
    const targetPath = new RegExp(relativeFrom, 'g');
    const replaced = build.replace(targetPath, relativeTo);
    await write(buildFile, replaced, 'utf8');
  }

  manifest.projects = [...new Set([...manifest.projects, relativeTo])].sort();
  const manifestFile = `${root}/manifest.json`;
  await write(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');

  await align({root, cwd: absoluteTo});

  if (hooks) await executeHook(hooks.postscaffold, absoluteTo);
};

module.exports = {scaffold};
