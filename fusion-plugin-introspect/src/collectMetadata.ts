/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/* eslint-env node */
import fs from 'fs';
import path from 'path';

export const collectMetadata = (root: string, keys: Array<string>) => {
  const {dependencies, dir} = findMetadata(root);
  const environmentVariables = collectEnvironmentVariables(keys);

  const nodeVersion = process.version;
  const packageManagersData = getPackageManagersData();
  const lockFileType = fs.existsSync(`${dir}/yarn.lock`)
    ? 'yarn'
    : fs.existsSync(`${dir}/package-lock.json`)
    ? 'npm'
    : 'none';

  return {
    timestamp: Date.now(),
    pid: process.pid,
    nodeVersion,
    npmVersion: packageManagersData.npm || '',
    yarnVersion: packageManagersData.yarn || '',
    lockFileType,
    ...dependencies,
    ...environmentVariables,
  };
};

const findMetadata = (dir) => {
  dir = path.resolve(process.cwd(), dir);
  try {
    const {dependencies = {}, devDependencies = {}} = JSON.parse(
      fs.readFileSync(`${dir}/package.json`, 'utf8')
    );
    if (Object.keys(devDependencies).length === 0) {
      // In a monorepo, dependencies may be hoisted up one or more levels
      throw new Error('In monorepo');
    }
    return {dependencies: {dependencies, devDependencies}, dir};
  } catch (e) {
    if (dir !== '/') {
      return findMetadata(path.resolve(dir, '..'));
    } else {
      return {dependencies: {dependencies: {}, devDependencies: {}}, dir: ''};
    }
  }
};

const PACKAGE_MANAGERS = new Set(['npm', 'yarn']);
const getPackageManagersData = (): any =>
  // Yarn: yarn/3.0.0-rc.2.git.20210503.hash-f661129e npm/? node/12.20.1 darwin x64
  // NPM: npm/6.14.10 node/v12.20.1 darwin x64
  (process.env.npm_config_user_agent || '').split(' ').reduce((acc, part) => {
    const parts = part.split('/');

    if (parts.length === 2) {
      const [product, productVersion] = parts;

      if (PACKAGE_MANAGERS.has(product)) {
        acc[product] = productVersion === '?' ? '' : productVersion;
      }
    }

    return acc;
  }, {});

const collectEnvironmentVariables = (keys) => {
  const vars = {};
  for (const key of keys) {
    vars[key] = process.env[key];
  }
  const varNames: Array<string> = Object.keys(process.env);
  return {varNames, vars};
};
