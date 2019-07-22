// @flow
const {satisfies, minVersion, validRange, compare, gt} = require('semver');
const {parse, stringify} = require('@yarnpkg/lockfile');
const {read, exec, write} = require('./node-helpers.js');

/*::
export type Report = {
  [string]: {
    [string]: Array<string>
  }
};
export type CheckArgs = {
  roots: Array<string>,
};
export type Check = (CheckArgs) => Promise<Report>;
*/
const check /*: Check */ = async ({roots}) => {
  const versions = {};
  function collectVersions(meta, type) {
    Object.keys(meta[type] || {}).forEach(name => {
      const version = meta[type][name];
      if (!versions[name]) versions[name] = {};
      if (!versions[name][version]) versions[name][version] = [];
      versions[name][version].push(meta.name);
      versions[name][version].sort();
    });
  }

  await Promise.all(
    roots.map(async dir => {
      const meta = JSON.parse(await read(`${dir}/package.json`, 'utf8'));
      collectVersions(meta, 'dependencies');
      collectVersions(meta, 'devDependencies');
      collectVersions(meta, 'peerDependencies');
      collectVersions(meta, 'optionalDependencies');
    })
  );
  Object.keys(versions).forEach(name => {
    if (Object.keys(versions[name]).length === 1) delete versions[name];
  });

  return versions;
};

/*::
export type Addition = {
  name: string,
  range: string,
  type: string,
};
export type AddArgs = {
  roots: Array<string>,
  additions?: Array<Addition>,
  ignore?: Array<string>,
  tmp?: string,
};
export type Add = (AddArgs) => Promise<void>;
*/
const add /*: Add */ = async ({roots, additions, ignore, tmp}) => {
  await diff({roots, additions, ignore, tmp});
};

/*::
export type RemoveArgs = {
  roots: Array<string>,
  removals?: Array<string>,
  ignore?: Array<string>,
  tmp?: string,
};
export type Remove = (RemoveArgs) => Promise<void>;
*/
const remove /*: Remove */ = async ({roots, removals, ignore, tmp}) => {
  await diff({roots, removals, ignore, tmp});
};

/*::
export type Upgrading = {
  name: string,
  range?: string,
  from?: string,
};
export type UpgradeArgs = {
  roots: Array<string>,
  upgrades?: Array<Upgrading>,
  ignore?: Array<string>,
  tmp?: string,
};
export type Upgrade = (UpgradeArgs) => Promise<void>;
*/
const upgrade /*: Upgrade */ = async ({roots, upgrades, ignore, tmp}) => {
  await diff({roots, upgrades, ignore, tmp});
};

/*::
export type SyncArgs = {
  roots: Array<string>,
  ignore?: Array<string>,
  tmp?: string,
};
export type Sync = (SyncArgs) => Promise<void>;
*/
const sync /*: Sync */ = async ({roots, ignore, tmp}) => {
  await diff({roots, ignore, tmp});
};

/*::
export type MergeArgs = {
  roots: Array<string>,
  out: string,
  ignore?: Array<string>,
  frozenLockfile?: boolean,
  tmp?: string,
}
export type Merge = (MergeArgs) => Promise<void>;
*/
const merge /*: Merge */ = async ({
  roots,
  out,
  ignore = [],
  frozenLockfile = false,
  tmp = '/tmp',
}) => {
  const metas = await getMetadata({roots});
  const updated = await update({metas, ignore, tmp, frozenLockfile});
  const merged = {dir: out, meta: {}, lockfile: {}};
  for (const {meta, lockfile} of updated) {
    for (const {name, range, type} of getDepEntries(meta)) {
      const ignored = ignore.find(dep => dep === name);
      if (ignored) continue;

      if (!merged.meta[type]) merged.meta[type] = {};
      merged.meta[type][name] = range;
      Object.assign(merged.lockfile, lockfile);
    }
  }
  await writeMetadata({metas: [merged]});
};

/*::
type DiffArgs = {
  roots: Array<string>,
  additions?: Array<Addition>,
  removals?: Array<string>,
  upgrades?: Array<Upgrading>,
  ignore?: Array<string>,
  tmp?: string,
};
type Diff = (DiffArgs) => Promise<void>;
*/
const diff /*: Diff */ = async ({
  roots,
  additions = [],
  removals = [],
  upgrades = [],
  ignore = [],
  tmp = '/tmp',
}) => {
  const metas = await getMetadata({roots});
  await writeMetadata({
    metas: /*:: await */ await update({
      metas,
      additions,
      removals,
      upgrades,
      ignore,
      tmp,
    }),
  });
};

const getMetadata = async ({roots}) => {
  return Promise.all(
    roots.map(async dir => {
      const metaFile = `${dir}/package.json`;
      const meta = JSON.parse(await read(metaFile, 'utf8').catch(() => '{}'));

      const yarnLock = `${dir}/yarn.lock`;
      const {object} = parse(await read(yarnLock, 'utf8').catch(() => ''));

      return {dir, meta, lockfile: object};
    })
  );
};

const writeMetadata = async ({metas}) => {
  await Promise.all(
    metas.map(async ({dir, meta, lockfile}) => {
      await exec(`mkdir -p ${dir}`);
      await write(`${dir}/package.json`, JSON.stringify(meta, null, 2), 'utf8');
      await write(`${dir}/yarn.lock`, stringify(lockfile), 'utf8');
    })
  );
};

const getDepEntries = meta => {
  const entries = [];
  const types = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
    'resolutions',
  ];
  for (const type of types) {
    for (const name in meta[type]) {
      entries.push({name, range: meta[type][name], type});
    }
  }
  return entries;
};

/*::
export type PackageJson = {
  name: string,
  version: string,
  dependencies?: {[string]: string},
  devDependencies?: {[string]: string},
  optionalDependencies?: {[string]: string},
  peerDependencies?: {[string]: string},
  resolutions?: {[string]: string},
};
export type Lockfile = {
  [string]: {
    version: string,
    dependencies?: {
      [string]: string,
    }
  }
}
export type Metadata = {
  dir: string,
  meta: PackageJson,
  lockfile: Lockfile,
};
export type UpdateArgs = {
  metas: Array<Metadata>,
  additions?: Array<Addition>,
  removals?: Array<string>,
  upgrades?: Array<Upgrading>,
  ignore?: Array<string>,
  frozenLockfile?: boolean,
  tmp?: string,
};
export type Update = (UpdateArgs) => Promise<Array<Metadata>>;
*/
const update /*: Update */ = async ({
  metas,
  additions = [],
  removals = [],
  upgrades = [],
  ignore = [],
  frozenLockfile = false,
  tmp = '/tmp',
}) => {
  // populate missing ranges w/ latest
  const insertions = [...additions, ...upgrades];
  if (insertions.length > 0) {
    if (frozenLockfile) throwEditError('Checking version to add');
    await Promise.all(
      insertions.map(async insertion => {
        if (!insertion.range) {
          const cmd = `yarn info ${insertion.name} version --json`;
          const info = await exec(cmd, {env: process.env});
          const {data} = JSON.parse(info);
          insertion.range = `^${data}`; // eslint-disable-line require-atomic-updates
        }
      })
    );
  }

  for (const {meta, lockfile} of metas) {
    // handle removals
    if (removals.length > 0) {
      if (frozenLockfile) throwEditError('Removing dep');
      for (const name of removals) {
        const types = [
          'dependencies',
          'devDependencies',
          'peerDependencies',
          'optionalDependencies',
          'resolutions',
        ];
        for (const type of types) {
          if (meta[type]) {
            if (meta[type][name]) delete meta[type][name];
            if (Object.keys(meta[type]).length === 0) delete meta[type];
          }
        }
      }
    }

    // list additions in package.json
    if (additions.length > 0) {
      if (frozenLockfile) throwEditError('Adding dep');
      for (const {name, range, type} of additions) {
        if (!meta[type]) meta[type] = {};
        meta[type][name] = range;
      }
    }

    // handle upgrades
    if (upgrades.length > 0) {
      if (frozenLockfile) throwEditError('Upgrading dep');
      for (const {name, range, from} of upgrades) {
        const types = [
          'dependencies',
          'devDependencies',
          'peerDependencies',
          'optionalDependencies',
          'resolutions',
        ];
        for (const type of types) {
          if (meta[type] && meta[type][name] && range) {
            if (!from || satisfies(minVersion(meta[type][name]), from)) {
              meta[type][name] = range;
            }
          }
        }
      }
    }

    // install missing deps
    const missing = {};
    for (const {name, range, type} of getDepEntries(meta)) {
      if (!lockfile[`${name}@${range}`] && !ignore.find(dep => dep === name)) {
        if (!missing[type]) missing[type] = {};
        missing[type][name] = range;
      }
    }
    if (Object.keys(missing).length > 0) {
      if (frozenLockfile) throwEditError('Installing dep');
      const cwd = `${tmp}/yarn-utils-${Math.random() * 1e17}`;
      const data = JSON.stringify(missing, null, 2);
      await exec(`mkdir -p ${cwd}`);
      await write(`${cwd}/package.json`, data, 'utf8');
      const yarnrc = '"--install.frozen-lockfile" false';
      await write(`${cwd}/.yarnrc`, yarnrc, 'utf8');
      const install = `yarn install --ignore-scripts --ignore-engines`;
      await exec(install, {cwd}, [process.stdout, process.stderr]);

      // copy newly installed deps back to original package.json/yarn.lock
      const [added] = await getMetadata({roots: [cwd]});
      for (const {name, range, type} of getDepEntries(added.meta)) {
        if (!meta[type]) meta[type] = {};
        if (meta[type]) meta[type][name] = range;
      }
      Object.assign(lockfile, added.lockfile);
    }
  }

  // index lockfiles
  const ids = new Set(); // for deduping
  const index = {};
  for (const {lockfile} of metas) {
    for (const key in lockfile) {
      const [, name, range] = key.match(/(.+?)@(.+)/) || [];
      const isAlias = range.includes(':') || !validRange(range);
      const id = `${key}|${lockfile[key].version}`;
      if (!index[name]) index[name] = [];
      if (!ids.has(id)) {
        index[name].push({lockfile, key, isAlias});
        ids.add(id);
      }
    }
  }
  for (const name in index) {
    index[name].sort((a, b) => {
      const aVersion = a.lockfile[a.key].version;
      const bVersion = b.lockfile[b.key].version;
      return b.isAlias - a.isAlias || compare(bVersion, aVersion);
    });
  }

  // sync
  for (const item of metas) {
    const {meta, lockfile} = item;
    const graph = {};
    const ref = frozenLockfile ? lockfile : null;
    for (const {name, range, type} of getDepEntries(meta)) {
      if (type === 'resolutions') continue;
      const ignored = ignore.find(dep => dep === name);
      if (!ignored) populateGraph({graph, name, range, index, ref});
    }
    if (frozenLockfile && enumerationChanged(lockfile, graph)) {
      throwEditError('Enumeration changed');
    }
    item.lockfile = graph;
  }

  return metas;
};

const populateGraph = ({graph, name, range, index, ref}) => {
  const key = `${name}@${range}`;
  if (key in graph) return;

  for (const ptr of index[name]) {
    const version = ptr.lockfile[ptr.key].version;
    if (ptr.isAlias || isBetterVersion(version, range, graph, key)) {
      graph[key] = ptr.lockfile[ptr.key];
      break;
    }
  }
  if (!graph[key]) return;
  if (ref !== null && ref[key] !== graph[key]) throwEditError('Version synced');
  populateDeps({graph, deps: graph[key].dependencies || {}, index, ref});
};

const populateDeps = ({graph, deps, index, ref}) => {
  for (const name in deps) {
    const range = deps[name];
    populateGraph({graph, name, range, index, ref});
  }
};

const isBetterVersion = (version, range, graph, key) => {
  return (
    satisfies(version, range) &&
    (!graph[key] || gt(version, graph[key].version))
  );
};

const enumerationChanged = (a, b) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return true;
  if (aKeys.sort().join() !== bKeys.sort().join()) return true;
  return false;
};

const throwEditError = reason => {
  throw new Error(
    `Updating lockfile is not allowed with frozenLockfile. ` +
      `This error is most likely happening if you have committed ` +
      `out-of-date lockfiles and tried to install deps in CI. ` +
      `Install your deps again locally. ${reason}`
  );
};

module.exports = {check, add, remove, upgrade, sync, merge};
