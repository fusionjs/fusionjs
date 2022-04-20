// @flow
/* eslint-env node */
const path = require('path');
const fs = require('fs');

function tryReadFile(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf-8');
  } catch {
    return false;
  }
}

// Adopted from Node.js internal lib
// @see: https://github.com/nodejs/node/blob/da0ede1ad55a502a25b4139f58aab3fb1ee3bf3f/lib/internal/modules/cjs/loader.js#L288-L336
const packageJsonCache = new Map();
function readPackage(requestPath) {
  const jsonPath = path.resolve(requestPath, 'package.json');

  if (packageJsonCache.has(jsonPath)) {
    return packageJsonCache.get(jsonPath);
  }

  const json = tryReadFile(jsonPath);
  if (json === false) {
    packageJsonCache.set(jsonPath, false);
    return false;
  }

  try {
    const parsed = JSON.parse(json);
    const filtered = {
      name: parsed.name,
      main: parsed.main,
      exports: parsed.exports,
      imports: parsed.imports,
      type: parsed.type,
    };
    packageJsonCache.set(jsonPath, filtered);
    return filtered;
  } catch (e) {
    e.path = jsonPath;
    e.message = 'Error parsing ' + jsonPath + ': ' + e.message;
    throw e;
  }
}

function readPackageScope(checkPath) {
  const rootSeparatorIndex = checkPath.indexOf(path.sep);
  let separatorIndex;
  do {
    separatorIndex = checkPath.lastIndexOf(path.sep);
    checkPath = checkPath.slice(0, separatorIndex);
    if (checkPath.endsWith(path.sep + 'node_modules')) return false;
    const pjson = readPackage(checkPath + path.sep);
    if (pjson)
      return {
        data: pjson,
        path: checkPath,
      };
  } while (separatorIndex > rootSeparatorIndex);
  return false;
}

// @see: https://nodejs.org/api/packages.html#packages_determining_module_system
function isEsModule(modulePath /*: string*/) {
  if (modulePath.endsWith('.cjs')) {
    return false;
  }

  if (modulePath.endsWith('.mjs')) {
    return true;
  }

  // @see: https://github.com/nodejs/node/blob/da0ede1ad55a502a25b4139f58aab3fb1ee3bf3f/lib/internal/modules/cjs/loader.js#L1120-L1123
  if (modulePath.endsWith('.js')) {
    const pkg = readPackageScope(modulePath);

    if (pkg && pkg.data && pkg.data.type === 'module') {
      return true;
    }
  }

  return false;
}

module.exports = isEsModule;
