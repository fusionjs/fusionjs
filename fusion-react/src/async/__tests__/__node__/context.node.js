/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import tape from 'tape-cup';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import Provider from '../../prepare-provider';
import {prepare} from '../../index.js';

tape('Handling context', async t => {
  class Child extends React.Component<any, any> {
    static contextTypes = {
      field: () => {},
    };

    constructor(props: *) {
      super(props);
    }

    render() {
      return <h1>{this.context.field ? 'Yes' : 'No'}</h1>;
    }
  }

  class Parent extends React.Component<any, any> {
    static childContextTypes = {
      field: () => {},
    };

    getChildContext() {
      return {field: true};
    }

    render() {
      return <Child />;
    }
  }

  const ToTest = () => {
    return (
      <Parent>
        <Child />
      </Parent>
    );
  };

  const app = (
    <Provider>
      <ToTest />
    </Provider>
  );
  t.ok(/Yes/.test(renderToString(app)));
  await prepare(app);
  t.ok(/Yes/.test(renderToString(app)));
  t.end();
});
