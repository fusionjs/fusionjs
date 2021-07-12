// @noflow
import App from 'fusion-core';

import test from '../node_modules/mapbox-gl';
import other from '../node_modules/other';

console.log('helloworld');

console.log(test);
console.log(other);

export default (async function () {
  return new App('el', (el) => el);
});
