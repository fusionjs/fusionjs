/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable react/no-multi-comp */
import tape from 'tape-cup';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import Provider from '../../prepare-provider';
import {prepare, split} from '../../index.js';

tape('Preparing an app with an async component', async t => {
  function DeferredComponent(props: {foo: 'foo'}) {
    return <div>Loaded</div>;
  }
  function LoadingComponent() {
    return <div>Loading</div>;
  }
  function ErrorComponent() {
    return <div>Failed</div>;
  }

  const ToTest = split({
    defer: false,
    load: () => (Promise.resolve({default: DeferredComponent}): any),
    LoadingComponent,
    ErrorComponent,
  });

  const app = (
    <Provider>
      <ToTest foo="foo" />
    </Provider>
  );

  t.ok(/Loading/.test(renderToString(app)), 'starts off loading');

  await prepare(app);

  t.ok(/Loaded/.test(renderToString(app)), 'ends loaded');
  try {
    await prepare(app);
  } catch (e) {
    t.ifError(e, 'should not error');
  }
  t.end();
});

tape('Preparing an app with an errored async component', async t => {
  function LoadingComponent() {
    return <div>Loading</div>;
  }
  function ErrorComponent() {
    return <div>Failed</div>;
  }

  const ToTest = split({
    defer: false,
    load: () => (Promise.reject(new Error('failed')): any),
    LoadingComponent,
    ErrorComponent,
  });

  const app = (
    <Provider>
      <ToTest />
    </Provider>
  );

  t.ok(/Loading/.test(renderToString(app)), 'starts off loading');
  await prepare(app);
  t.ok(/Failed/.test(renderToString(app)), 'ends failed');
  t.end();
});
