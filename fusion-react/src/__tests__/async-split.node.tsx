/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import Provider from '../async/prepare-provider';
import {prepare, split} from '../async/index';

test('Preparing an app with an async component', async () => {
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
    load: () => Promise.resolve({default: DeferredComponent}),
    LoadingComponent,
    ErrorComponent,
  });

  const app = (
    <Provider>
      <ToTest foo="foo" />
    </Provider>
  );

  expect(/Loading/.test(renderToString(app))).toBeTruthy();

  // @ts-ignore
  await prepare(app);

  expect(/Loaded/.test(renderToString(app))).toBeTruthy();
  // @ts-ignore
  await expect(prepare(app)).resolves.toBeUndefined();
});

test('Preparing an app with an errored async component', async () => {
  function LoadingComponent() {
    return <div>Loading</div>;
  }
  function ErrorComponent() {
    return <div>Failed</div>;
  }

  const ToTest = split({
    defer: false,
    load: () => Promise.reject(new Error('failed')) as any,
    LoadingComponent,
    ErrorComponent,
  });

  const app = (
    <Provider>
      <ToTest />
    </Provider>
  );

  expect(/Loading/.test(renderToString(app))).toBeTruthy();
  // @ts-ignore
  await prepare(app);
  expect(/Failed/.test(renderToString(app))).toBeTruthy();
});
