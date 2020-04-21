// @flow
/* sorts package.json based on the following criteria
 * name first
 * description second
 * version third
 * author fourth
 * all other keys in alphabetical order
 * dependencies and devDependencies sorted alphabetically
 * newline at the end of the file
 */
module.exports = function sortPackageJson(pkg /*: Object */) /*: string */ {
  const specialKeys = ['name', 'description', 'version', 'author'];
  const nextPkg = {};
  const pkgKeys = Object.keys(pkg)
    .filter(key => !specialKeys.includes(key))
    .sort();
  specialKeys.concat(pkgKeys).forEach(key => {
    if (Array.isArray(pkg[key])) {
      nextPkg[key] = pkg[key].sort();
    } else if (pkg[key] && typeof pkg[key] === 'object') {
      nextPkg[key] = sortObject(pkg[key]);
    } else {
      nextPkg[key] = pkg[key];
    }
  });
  return JSON.stringify(nextPkg, null, 2) + '\n';
};

function sortObject(obj) {
  const nextObj = {};
  Object.keys(obj)
    .sort()
    .forEach(key => {
      if (Array.isArray(obj[key])) {
        nextObj[key] = obj[key].sort();
      } else if (obj[key] && typeof obj[key] === 'object') {
        nextObj[key] = sortObject(obj[key]);
      } else {
        nextObj[key] = obj[key];
      }
    });
  return nextObj;
}
