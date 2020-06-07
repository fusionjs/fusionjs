// Adapted from 'resolve-from' module. Added support for NODE_PRESERVE_SYMLINKS environment variable
// TODO: Make PR to original resolve-from lib
// @flow
/* eslint-env node */
const path = require('path');
// $FlowFixMe
const Module = require('module');
const fs = require('fs');

const resolveFrom = (
  fromDirectory /*: string */,
  moduleId /*: string */,
  silent /*: boolean */
) /*: ?string */ => {
  if (typeof fromDirectory !== 'string') {
    throw new TypeError(
      `Expected \`fromDir\` to be of type \`string\`, got \`${typeof fromDirectory}\``
    );
  }

  if (typeof moduleId !== 'string') {
    throw new TypeError(
      `Expected \`moduleId\` to be of type \`string\`, got \`${typeof moduleId}\``
    );
  }

  if (!process.env.NODE_PRESERVE_SYMLINKS) {
    try {
      fromDirectory = fs.realpathSync(fromDirectory);
    } catch (error) {
      if (error.code === 'ENOENT') {
        fromDirectory = path.resolve(fromDirectory);
      } else if (silent) {
        return;
      } else {
        throw error;
      }
    }
  } else {
    fromDirectory = path.resolve(fromDirectory);
  }

  const fromFile = path.join(fromDirectory, 'noop.js');

  const resolveFileName = () =>
    Module._resolveFilename(moduleId, {
      id: fromFile,
      filename: fromFile,
      paths: Module._nodeModulePaths(fromDirectory),
    });

  if (silent) {
    try {
      return resolveFileName();
    } catch (error) {
      return;
    }
  }

  return resolveFileName();
};

module.exports = (
  fromDirectory /*: string */,
  moduleId /*: string */
) /*: ?string */ => resolveFrom(fromDirectory, moduleId, false);
module.exports.silent = (
  fromDirectory /*: string */,
  moduleId /*: string */
) /*: ?string */ => resolveFrom(fromDirectory, moduleId, true);
