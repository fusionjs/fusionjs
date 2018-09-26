/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';
import isReactFunctionalComponent from '../isReactFunctionalComponent.js';

tape('isReactFunctionalComponent', async t => {
  class Comp {
    render() {}
  }
  const fn = function() {};
  const arrow = () => {};
  t.ok(!isReactFunctionalComponent(Comp));
  t.ok(isReactFunctionalComponent(fn));
  t.ok(isReactFunctionalComponent(arrow));
  t.ok(!isReactFunctionalComponent(''));
  t.ok(!isReactFunctionalComponent(null));
  t.ok(!isReactFunctionalComponent(undefined));
  t.end();
});
