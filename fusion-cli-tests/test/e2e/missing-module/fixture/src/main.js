// @noflow
// importing a non-existent module should generate a compiler error
import '__non_existent_module__';

export default function () {
  // dynamic import of a non-existent module should generate a compiler error
  console.log(import('./missing-module.js'));
}
