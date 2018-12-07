/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import {exec} from './exec.js';

export const collectMetadata = (root: string, keys: Array<string>) => {
  const {dependencies, dir} = findMetadata(root);
  const environmentVariables = collectEnvironmentVariables(keys);

  const nodeVersion = process.version;
  const npmVersion = exec('npm --version');
  const yarnVersion = exec('yarn --version');
  const lockFileType = fs.existsSync(`${dir}/yarn.lock`)
    ? 'yarn'
    : fs.existsSync(`${dir}/package-lock.json`)
    ? 'npm'
    : 'none';
  const lockFile =
    lockFileType === 'yarn'
      ? fs.readFileSync(`${dir}/yarn.lock`, 'utf8')
      : lockFileType === 'npm'
      ? fs.readFileSync(`${dir}/package-lock.json`, 'utf8')
      : '';

  return {
    timestamp: Date.now(),
    pid: process.pid,
    nodeVersion,
    npmVersion,
    yarnVersion,
    lockFileType,
    lockFile,
    ...dependencies,
    ...environmentVariables,
  };
};

const findMetadata = dir => {
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

const collectEnvironmentVariables = keys => {
  const vars = {};
  for (const key of keys) {
    vars[key] = process.env[key];
  }
  const varNames: Array<string> = Object.keys(process.env);
  return {varNames, vars};
};
