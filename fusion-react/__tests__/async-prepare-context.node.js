/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import {prepare} from '../src/async/index.js';

test('Preparing a sync app passing through context', done => {
  let numConstructors = 0;
  let numRenders = 0;
  let numChildRenders = 0;
  class SimpleComponent extends React.Component<any, any> {
    constructor(props, context) {
      super(props, context);
      numConstructors++;
    }
    getChildContext() {
      return {
        test: 'data',
      };
    }
    render() {
      numRenders++;
      return <SimplePresentational />;
    }
  }
  SimpleComponent.childContextTypes = {
    test: () => {},
  };
  function SimplePresentational(props, context) {
    expect(context.test).toBe('data');
    numChildRenders++;
    return <div>Hello World</div>;
  }
  SimplePresentational.contextTypes = {
    test: () => {},
  };
  const app = <SimpleComponent />;
  const p = prepare(app);
  expect(p instanceof Promise).toBeTruthy();
  p.then(() => {
    expect(numConstructors).toBe(1);
    expect(numRenders).toBe(1);
    expect(numChildRenders).toBe(1);
    done();
  });
});
