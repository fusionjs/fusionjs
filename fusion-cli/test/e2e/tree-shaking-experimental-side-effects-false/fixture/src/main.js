// @noflow
import {used, unused} from 'pkg';
import {used2, unused2} from './user-code.js';
import {used3, unused3} from 'side-effects-false-pkg';

if (__NODE__) {
  // unused in the browser
  console.log(unused, unused2, unused3);
}

// unused in the browser
__NODE__ && unused;
__NODE__ && unused2;
__NODE__ && unused3;

console.log(used, used2, used3);

export default () => {};
