// @noflow
import {foo} from './foo.js';
import noop from './istanbul-ignore-coverage.js';
import noop2 from './istanbul-ignore-coverage-cli.js';

export default function() {
  noop();
  noop2();
  return foo();
}
