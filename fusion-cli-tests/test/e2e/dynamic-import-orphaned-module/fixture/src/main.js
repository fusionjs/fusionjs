// @noflow
import localDep from './local-dep.js';
export default function() {
  localDep();
  import('./local-dep.js');
}
