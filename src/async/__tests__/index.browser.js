/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable react/no-multi-comp */
import tape from 'tape-cup';
import React, {Component} from 'react';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {prepare} from '../../index.js';

Enzyme.configure({adapter: new Adapter()});
tape('Preparing in the browser with componentWillUnmount', t => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  let numUnmount = 0;
  class SimpleComponent extends Component<any> {
    constructor(props, context) {
      super(props, context);
      t.equal(
        context.__IS_PREPARE__,
        true,
        'sets __IS_PREPARE__ to true in context'
      );
      numConstructors++;
    }
    componentWillUnmount() {
      numUnmount++;
    }
    render() {
      numRenders++;
      return <SimplePresentational />;
    }
  }
  function SimplePresentational() {
    numChildRenders++;
    return <div>Hello World</div>;
  }
  const app = <SimpleComponent />;
  const p = prepare(app);
  t.ok(p instanceof Promise, 'prepare returns a promise');
  p.then(() => {
    t.equal(numConstructors, 1, 'constructs SimpleComponent once');
    t.equal(numRenders, 1, 'renders SimpleComponent once');
    t.equal(numChildRenders, 1, 'renders SimplePresentational once');
    t.equal(numUnmount, 1, 'calls componentWillUnmount in browser');
    t.end();
  });
});
