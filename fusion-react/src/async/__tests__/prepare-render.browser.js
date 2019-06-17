/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import tape from 'tape-cup';
import * as React from 'react';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import ReactDOM from 'react-dom';
import {prepare} from '../../index.js';

Enzyme.configure({adapter: new Adapter()});

tape('Client-side preparing', t => {
  let numRenders = 0;
  function SimplePortal() {
    numRenders++;
    // $FlowFixMe
    return ReactDOM.createPortal(<div>Hello World</div>, document.body);
  }
  const app = <SimplePortal />;
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numRenders, 1, 'renders SimplePortal once');
    t.end();
  });
});
