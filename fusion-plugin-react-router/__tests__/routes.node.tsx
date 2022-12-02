/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import {renderToString as render} from 'react-dom/server';
import {Router, Routes, Route, Outlet} from '../src/server';
import {createServerHistory} from '../src/modules/ServerHistory';

test('routes matches as expected', () => {
  const Hello = () => <div>Hello</div>;
  const Hi = () => <div>Hi</div>;
  const ctx = {
    action: null,
    location: null,
    status: 200,
    url: null,
  };
  const history = createServerHistory('', ctx, '/');
  const el = (
    <Router history={history}>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/" element={<Hi />} />
      </Routes>
    </Router>
  );
  expect(/Hello/.test(render(el))).toBeTruthy();
  expect(!/Hi/.test(render(el))).toBeTruthy();
});

test('nested routes matches as expected', () => {
  const HelloParent = () => (
    <>
      <div>Hello</div>
      <Outlet />
    </>
  );
  const Hi = () => <div>Hi</div>;
  const ctx = {
    action: null,
    location: null,
    status: 200,
    url: null,
  };
  const history = createServerHistory('', ctx, '/outer/inner');
  const el = (
    <Router history={history}>
      <Routes>
        <Route path="/outer" element={<HelloParent />}>
          <Route path="inner" element={<Hi />} />
        </Route>
      </Routes>
    </Router>
  );
  expect(render(el)).toEqual('<div>Hello</div><div>Hi</div>');
});

test('nested routes with prefix matches as expected', () => {
  const HelloParent = () => (
    <>
      <div>Hello</div>
      <Outlet />
    </>
  );
  const Hi = () => <div>Hi</div>;
  const ctx = {
    action: null,
    location: null,
    status: 200,
    url: null,
  };
  const history = createServerHistory('/base', ctx, '/base/outer/inner');
  const el = (
    <Router basename="/base" history={history}>
      <Routes>
        <Route path="/outer" element={<HelloParent />}>
          <Route path="inner" element={<Hi />} />
        </Route>
      </Routes>
    </Router>
  );
  expect(render(el)).toEqual('<div>Hello</div><div>Hi</div>');
});

test('routes fires onRoute when location changes', (done) => {
  const Hello = () => <div>Hello</div>;

  const onRoute = (data) => {
    expect(data.page).toEqual('/hello');
    expect(data.title).toEqual('/hello');
    expect(data.params).toEqual({});
    done();
  };

  const ctx = {
    action: null,
    location: null,
    status: 200,
    url: null,
  };
  const history = createServerHistory('', ctx, '/hello');

  const el = (
    <Router history={history} onRoute={onRoute}>
      <Routes>
        <Route path="/hello" element={<Hello />} />
      </Routes>
    </Router>
  );
  render(el);
});

test('routes fires onRoute when location changes with nested route', (done) => {
  const HelloParent = () => (
    <>
      <div>Hello</div>
      <Outlet />
    </>
  );
  const Hello = () => <div>Hello</div>;

  let callNum = 0;
  const onRoute = (data) => {
    if (callNum === 0) {
      expect(data.page).toEqual('/outer');
      expect(data.title).toEqual('/outer');
      expect(data.params).toEqual({});
    } else if (callNum === 1) {
      expect(data.page).toEqual('/outer/inner');
      expect(data.title).toEqual('/outer/inner');
      expect(data.params).toEqual({});
      done();
    }
    callNum++;
  };

  const ctx = {
    action: null,
    location: null,
    status: 200,
    url: null,
  };
  const history = createServerHistory('', ctx, '/outer/inner');

  const el = (
    <Router history={history} onRoute={onRoute}>
      <Routes>
        <Route path="/outer" element={<HelloParent />}>
          <Route path="inner" element={<Hello />} />
        </Route>
      </Routes>
    </Router>
  );
  render(el);
});

test('routes fires onRoute when location changes with prefix', (done) => {
  const Hello = () => <div>Hello</div>;

  const onRoute = (data) => {
    expect(data.page).toEqual('/hello');
    expect(data.title).toEqual('/hello');
    expect(data.params).toEqual({});
    done();
  };

  const ctx = {
    action: null,
    location: null,
    status: 200,
    url: null,
  };
  const history = createServerHistory('/base', ctx, '/base/hello');
  const el = (
    <Router history={history} onRoute={onRoute} basename="/base">
      <Routes>
        <Route path="/hello" element={<Hello />} />
      </Routes>
    </Router>
  );
  render(el);
});

test('routes fires onRoute when location changes with custom trackingId', (done) => {
  const Hello = () => <div>Hello</div>;

  const onRoute = (data) => {
    expect(data.page).toEqual('/hello');
    expect(data.title).toEqual('custom-tracking-id');
    expect(data.params).toEqual({});
    done();
  };

  const ctx = {
    action: null,
    location: null,
    status: 200,
    url: null,
  };
  const history = createServerHistory('', ctx, '/hello');

  const el = (
    <Router history={history} onRoute={onRoute}>
      <Routes>
        <Route
          path="/hello"
          element={<Hello />}
          trackingId={'custom-tracking-id'}
        />
      </Routes>
    </Router>
  );
  render(el);
});

test('routes fires onRoute when location changes with custom trackingId, prefix, and nests', (done) => {
  const HelloParent = () => (
    <>
      <div>Hello</div>
      <Outlet />
    </>
  );
  const Hello = () => <div>Hello</div>;
  const Hi = () => <div>Hi</div>;
  let callNum = 0;
  const onRoute = (data) => {
    if (callNum === 0) {
      expect(data.page).toEqual('/outer');
      expect(data.title).toEqual('/outer');
      expect(data.params).toEqual({});
    } else if (callNum === 1) {
      expect(data.page).toEqual('/outer/inner');
      expect(data.title).toEqual('inner-tracking');
      expect(data.params).toEqual({});
      done();
    }
    callNum++;
  };

  const ctx = {
    action: null,
    location: null,
    status: 200,
    url: null,
  };
  const history = createServerHistory('/base', ctx, '/base/outer/inner');
  const falsy = false;
  const el = (
    <Router history={history} onRoute={onRoute} basename="/base">
      <Routes>
        <Route path="/outer" element={<HelloParent />}>
          <Route
            path="inner"
            element={<Hello />}
            trackingId={'inner-tracking'}
          />
          {falsy ? <Route path="not-gonna-work" element={<Hi />} /> : null}
        </Route>
      </Routes>
    </Router>
  );
  render(el);
});

test('nullish routes render without issue', () => {
  const HelloParent = () => (
    <>
      <div>Hello</div>
      <Outlet />
    </>
  );
  const Hi = () => <div>Hi</div>;
  const ctx = {
    action: null,
    location: null,
    status: 200,
    url: null,
  };
  const history = createServerHistory('', ctx, '/outer/inner');
  const falsy = false;
  const el = (
    <Router history={history}>
      <Routes>
        <Route path="/outer" element={<HelloParent />}>
          <Route path="inner" element={<Hi />} />
          {falsy ? <Route path="not-gonna-work" element={<Hi />} /> : null}
        </Route>
      </Routes>
    </Router>
  );
  expect(render(el)).toEqual('<div>Hello</div><div>Hi</div>');
});
