// MIT License

// Copyright (c) 2017 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import React from 'react';
import test from 'tape-cup';
import {Route} from '../modules/Route';
import getRouter from '../plugin';
import {withRouter} from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';
import ReactDOM from 'react-dom';
const {renderToString} = ReactDOMServer;
const {render} = ReactDOM;

function clientRender(element) {
  if (__BROWSER__) {
    const el = document.createElement('div');
    document.body.appendChild(el);
    render(element, el);
    document.body.removeChild(el);
  }
}

test('events with trackingId', t => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" trackingId="home" component={Hello} />
      <Route path="/lol" component={Hello} />
    </div>
  );
  const ctx = getMockCtx({
    url: '/',
    element,
  });
  const UniversalEvents = getMockEvents({
    t,
    title: 'home',
    page: '/',
    done: t.end,
  });
  const plugin = getRouter({UniversalEvents});
  runPlugin(plugin, ctx);
  t.notEquals(ctx.element, element, 'wraps ctx.element');
});

test('events with no tracking id', t => {
  const Hello = () => <div>Hello</div>;
  const element = (
    <div>
      <Route path="/" component={Hello} />
      <Route path="/lol" component={Hello} />
    </div>
  );

  const ctx = getMockCtx({
    url: '/',
    element,
  });
  const UniversalEvents = getMockEvents({
    t,
    title: '/',
    page: '/',
    done: t.end,
  });
  const plugin = getRouter({UniversalEvents});
  runPlugin(plugin, ctx);
  t.notEquals(ctx.element, element, 'wraps ctx.element');
});

test('events with no tracking id and deep path', t => {
  const Hello = () => <div>Hello</div>;
  if (__BROWSER__) {
    return t.end();
  }
  const element = (
    <div>
      <Route path="/user" component={Hello} />
      <Route path="/user/:uuid" component={Hello} />
    </div>
  );

  const ctx = getMockCtx({url: '/user/abcd', element});
  const UniversalEvents = getMockEvents({
    t,
    title: '/user/:uuid',
    page: '/user/:uuid',
    done: t.end,
  });
  const plugin = getRouter({UniversalEvents});
  plugin(ctx, () => {
    renderToString(ctx.element);
    return Promise.resolve();
  });
  t.notEquals(ctx.element, element, 'wraps ctx.element');
});

if (__BROWSER__) {
  test('mapping events in browser', t => {
    const Home = withRouter(({location, history}) => {
      if (location.pathname === '/') {
        history.push('/user/');
      }
      // add some nested routes
      return (
        <div>
          <Route path="/" component={Hello} />
        </div>
      );
    });
    const User = () => {
      // add some nested routes
      return (
        <div>
          <Route path="/" component={Hello} />
          <Route path="/abcd" component={Hello} />
        </div>
      );
    };
    const Hello = () => {
      return <div>Hello</div>;
    };
    const element = (
      <div>
        <Route path="/" component={Home} />
        <Route path="/user" component={User} />
      </div>
    );
    const ctx = getMockCtx({url: '/user', element});
    const expectedPayloads = [
      {page: '/', title: '/'},
      {page: '/user', title: '/user'},
    ];
    const UniversalEvents = {
      of() {
        let mapper;
        return {
          map(m) {
            mapper = m;
          },
          emit(type, payload) {
            const expected = expectedPayloads.shift();
            t.deepLooseEqual(payload, expected);
            const mapped = mapper({});
            t.equal(mapped.__url__, expected.title);
            if (expectedPayloads.length === 0) {
              t.end();
            }
          },
        };
      },
    };
    const plugin = getRouter({UniversalEvents});
    runPlugin(plugin, ctx, {title: '/user', page: '/user'});
  });
}

function getMockEvents({t, title: expectedTitle, page: expectedPage, done}) {
  const expected = __NODE__
    ? [
        'downstream:server',
        'render:server',
        'upstream:server',
        'pageview:server',
      ]
    : ['pageview:browser'];
  const values = [1, 2, 3, 4];
  const UniversalEvents = {
    of() {
      return {
        map(mapper) {
          t.equal(typeof mapper, 'function');
        },
        emit(type, {title, page, status, timing}) {
          t.equal(type, expected.shift(), 'emits with the correct type');
          t.equal(title, expectedTitle, 'correct title');
          t.equal(page, expectedPage, 'correct page');
          if (__NODE__) {
            t.equal(status, 200, 'emits status code');
            t.equal(timing, values.shift(), 'emits with the correct value');
          }
          if (expected.length === 0) {
            done();
          }
        },
      };
    },
  };
  return UniversalEvents;
}

function getMockCtx({url, path, element}) {
  return {
    url,
    path: path || url,
    status: 200,
    body: {
      body: [],
    },
    element,
    timing: {
      downstream: Promise.resolve(1),
      render: Promise.resolve(2),
      upstream: Promise.resolve(3),
      end: Promise.resolve(4),
    },
  };
}

function runPlugin(p, ctx, pageData = {title: '/', page: '/'}) {
  if (__BROWSER__) {
    const el = document.createElement('script');
    el.setAttribute('type', 'application/json');
    el.setAttribute('id', '__ROUTER_DATA__');
    const textNode = document.createTextNode(JSON.stringify(pageData));
    el.appendChild(textNode);
    document.body.appendChild(el);
  }
  p(ctx, () => {
    if (__NODE__) {
      renderToString(ctx.element);
    } else if (__BROWSER__) {
      clientRender(ctx.element);
    }
    return Promise.resolve();
  });
}
