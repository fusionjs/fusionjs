// @flow

/* Includes type imports from both node_modules and userland but as
 * standalone type imports and mixed imports:
 *    import type {AType, BType} from ...
 *    import {type AType, type BType, C, D} from ...
 */

// Import only types from dependency
import type {
  UnusedDependencyType,
  UsedDependencyType,
} from 'fixture-pkg';

// Import mixed types and values from dependency
import {
  type UnusedDependencyOtherType,
  type UsedDependencyOtherType,
  unusedDependencyValue,
  usedDependencyValue
} from 'fixture-pkg';

// Import only types from userland
import type {
  UnusedUserlandType,
  UsedUserlandType
} from './user-code.js';

// Import mixed types and values from userland
import {
  type UnusedUserlandOtherType,
  type UsedUserlandOtherType,
  unusedUserlandValue,
  usedUserlandValue
} from './user-code.js';

if (__NODE__) {
  // unused in the browser
  //  - node modules
  const unusedDepVal: UnusedDependencyType = { shouldBeUnused: unusedDependencyValue };
  const unusedDepVal2: UnusedDependencyOtherType = { alsoShouldBeUnused: unusedDependencyValue };
  //  - userland
  const unustedUserlandVal: UnusedUserlandType = { shouldBeUnused: unusedUserlandValue };
  const unustedUserlandVal2: UnusedUserlandOtherType = { alsoShouldBeUnused: unusedUserlandValue };

  console.log(unusedDepVal, unusedDepVal2, unustedUserlandVal, unustedUserlandVal2);
}

// used in the browser
//  - node modules
/* NOTE: As of 2019-05-21, the import below currently leaks the unused import
 * ('unusedDependencyValue') into the browser bundle.
 *
 * This appears unrelated to Flow type imports, and so remain commented out for now.
 */
// const usedDepVal: UsedDependencyType = { shouldBeUsed: usedDependencyValue};
// const usedDepVal2: UsedDependencyOtherType = { alsoShouldBeUsed: usedDependencyValue};;
//  - userland
const usedUserlandVal: UsedUserlandType = { shouldBeUsed: usedUserlandValue};
const usedUserlandVal2: UsedUserlandOtherType = { alsoShouldBeUsed: usedUserlandValue};;

console.log(/*usedDepVal, usedDepVal2,*/ usedUserlandVal, usedUserlandVal2);

export default () => {};
