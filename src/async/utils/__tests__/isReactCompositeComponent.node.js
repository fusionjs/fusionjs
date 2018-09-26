/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';
import isReactCompositeComponent from '../isReactCompositeComponent.js';

tape('isReactCompositeComponent', async t => {
  class Yes {
    render() {}
  }
  class No {}
  const fn = function() {};
  const arrow = () => {};
  t.ok(isReactCompositeComponent(Yes));
  t.ok(!isReactCompositeComponent(No));
  t.ok(!isReactCompositeComponent(fn));
  t.ok(!isReactCompositeComponent(arrow));
  t.ok(!isReactCompositeComponent(''));
  t.ok(!isReactCompositeComponent(null));
  t.ok(!isReactCompositeComponent(undefined));
  t.end();
});
