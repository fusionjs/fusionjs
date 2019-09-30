// @flow
const {read} = require('./node-helpers.js');

/*::
export type GetManifestArgs = {
  root: string,
};
export type GetManifest = (GetManifestArgs) => Promise<Manifest>
export type Manifest = {
  projects: Array<string>,
  versionPolicy?: VersionPolicy,
  hooks?: Hooks,
  workspace: "host" | "sandbox",
}
export type VersionPolicy = {
  lockstep: boolean,
  exceptions: Array<string>,
}
export type Hooks = {
  preinstall?: string,
  postinstall?: string,
}
*/
const getManifest /*: GetManifest */ = async ({root}) => {
  const manifest = `${root}/manifest.json`;
  const data = await read(manifest, 'utf8');
  const parsed = JSON.parse(data || '{}');
  parsed.workspace = parsed.workspace || 'host';
  parsed.projects = parsed.projects || [];
  return parsed;
};

module.exports = {getManifest};
