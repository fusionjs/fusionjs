// @noflow
import {used, unused} from 'fixture-pkg';
import {used2, unused2} from './user-code.js';

if (__NODE__) {
  // unused in the browser
  console.log(unused, unused2);
}

// unused in the browser
__NODE__ && unused;
__NODE__ && unused2;

console.log(used, used2);

export default () => {};
