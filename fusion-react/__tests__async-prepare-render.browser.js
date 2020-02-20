/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env browser */
import * as React from 'react';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import ReactDOM from 'react-dom';
import {prepare} from './src/index.js';

Enzyme.configure({adapter: new Adapter()});

test('Client-side preparing', done => {
  let numRenders = 0;
  function SimplePortal() {
    numRenders++;
    // $FlowFixMe
    return ReactDOM.createPortal(<div>Hello World</div>, document.body);
  }
  const app = <SimplePortal />;
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numRenders).toBe(1);
    done();
  });
});
