/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import MockEmitter from 'events';

import App, {createPlugin, createToken} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import {getSimulator} from 'fusion-test-utils';
import type {Token} from 'fusion-core';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import {I18nToken} from 'fusion-plugin-i18n';

import RPCPlugin from '../src/browser.js';
import type {IEmitter} from '../src/types.js';
import createMockEmitter from './create-mock-emitter';
import {RPCHandlersConfigToken, RPCQueryParamsToken} from '../src/tokens.js';

const MockPluginToken: Token<any> = createToken('test-plugin-token');
function createTestFixture() {
  const mockFetch = (...args) =>
    Promise.resolve({json: () => ({status: 'success', data: args})});
  const mockEmitter: IEmitter = (new MockEmitter(): any);
  const mockEmitterPlugin = createPlugin({
    provides: () => mockEmitter,
  });
  const mockI18nPlugin = createPlugin({
    provides: () => ({
      from: () => ({
        locale: 'el-GR',
        load: async () => {},
        translate: () => '',
      }),
    }),
  });

  const app = new App('content', el => el);
  // $FlowFixMe
  app.register(FetchToken, mockFetch);
  app.register(UniversalEventsToken, mockEmitterPlugin);
  app.register(I18nToken, mockI18nPlugin);
  app.register(MockPluginToken, RPCPlugin);
  return app;
}

test('success status request', done => {
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method-client');
      expect(payload.method).toBe('test');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
    },
  });
  const app = createTestFixture();
  app.register(UniversalEventsToken, mockEmitter);

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from({
          memoized: new Map(),
        });
        expect(typeof rpc.request).toBe('function');
        expect(rpc.request('test') instanceof Promise).toBeTruthy();
        rpc
          .request('test')
          .then(([url, options]) => {
            expect(url).toBe('/api/test?localeCode=el-GR');
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe('application/json');
            expect(options.body).toBe('{}');
            done();
          })
          .catch(e => {
            // $FlowFixMe
            done.fail(e);
          });

        wasResolved = true;
      },
    })
  );

  expect(wasResolved).toBeTruthy();
});

test('success status request with additional query params', done => {
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method-client');
      expect(payload.method).toBe('test');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
    },
  });
  const app = createTestFixture();
  app.register(UniversalEventsToken, mockEmitter);
  app.register(RPCQueryParamsToken, {
    from() {
      return [['hello', 'world']];
    },
  });

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from({
          memoized: new Map(),
        });
        expect(typeof rpc.request).toBe('function');
        expect(rpc.request('test') instanceof Promise).toBeTruthy();
        rpc
          .request('test')
          .then(([url, options]) => {
            expect(url).toBe('/api/test?hello=world&localeCode=el-GR');
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe('application/json');
            expect(options.body).toBe('{}');
            done();
          })
          .catch(e => {
            // $FlowFixMe
            done.fail(e);
          });

        wasResolved = true;
      },
    })
  );

  expect(wasResolved).toBeTruthy();
});

test('success status request (with custom api path)', done => {
  const app = createTestFixture();

  app.register(RPCHandlersConfigToken, {apiPath: 'test/api/path'});

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from({
          memoized: new Map(),
        });
        expect(typeof rpc.request).toBe('function');
        expect(rpc.request('test') instanceof Promise).toBeTruthy();
        rpc
          .request('test')
          .then(([url, options]) => {
            expect(url).toBe('/test/api/path/test?localeCode=el-GR');
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe('application/json');
            expect(options.body).toBe('{}');
            done();
          })
          .catch(e => {
            // $FlowFixMe
            done.fail(e);
          });

        wasResolved = true;
      },
    })
  );

  expect(wasResolved).toBeTruthy();
});

test('success status request (with custom api path containing slashes)', done => {
  const app = createTestFixture();

  app.register(RPCHandlersConfigToken, {apiPath: '///test/api///path/'});

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from({
          memoized: new Map(),
        });
        expect(typeof rpc.request).toBe('function');
        expect(rpc.request('test') instanceof Promise).toBeTruthy();
        rpc
          .request('test')
          .then(([url, options]) => {
            expect(url).toBe('/test/api/path/test?localeCode=el-GR');
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe('application/json');
            expect(options.body).toBe('{}');
            done();
          })
          .catch(e => {
            // $FlowFixMe
            done.fail(e);
          });

        wasResolved = true;
      },
    })
  );

  expect(wasResolved).toBeTruthy();
});

test('success status request w/args and header', done => {
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method-client');
      expect(payload.method).toBe('test');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
    },
  });
  const app = createTestFixture();
  // $FlowFixMe
  app.register(UniversalEventsToken, mockEmitter);

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from({
          memoized: new Map(),
        });
        expect(typeof rpc.request).toBe('function');
        expect(rpc.request('test') instanceof Promise).toBeTruthy();
        rpc
          .request('test', {args: 1}, {'test-header': 'header value'})
          .then(([url, options]) => {
            expect(url).toBe('/api/test?localeCode=el-GR');
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe('application/json');
            expect(options.headers['test-header']).toBe('header value');
            expect(options.body).toBe('{"args":1}');
            done();
          })
          .catch(e => {
            // $FlowFixMe
            done.fail(e);
          });

        wasResolved = true;
      },
    })
  );

  expect(wasResolved).toBeTruthy();
});

test('success status request w/args and options', done => {
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method-client');
      expect(payload.method).toBe('test');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
    },
  });
  const app = createTestFixture();
  // $FlowFixMe
  app.register(UniversalEventsToken, mockEmitter);

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from({
          memoized: new Map(),
        });
        expect(typeof rpc.request).toBe('function');
        expect(rpc.request('test') instanceof Promise).toBeTruthy();
        rpc
          .request('test', {args: 1}, null, {credentials: 'omit'})
          .then(([url, options]) => {
            expect(url).toBe('/api/test?localeCode=el-GR');
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe('application/json');
            expect(options.credentials).toBe('omit');
            expect(options.body).toBe('{"args":1}');
            done();
          })
          .catch(e => {
            // $FlowFixMe
            done.fail(e);
          });

        wasResolved = true;
      },
    })
  );

  expect(wasResolved).toBeTruthy();
});

test('success status request w/form data', done => {
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method-client');
      expect(payload.method).toBe('test');
      expect(payload.status).toBe('success');
      expect(typeof payload.timing).toBe('number');
    },
  });
  const app = createTestFixture();
  // $FlowFixMe
  app.register(UniversalEventsToken, mockEmitter);

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from({
          memoized: new Map(),
        });
        expect(typeof rpc.request).toBe('function');
        expect(rpc.request('test') instanceof Promise).toBeTruthy();
        // eslint-disable-next-line cup/no-undef
        const formData = new FormData();
        formData.append('random', 'some-random');
        formData.append('foo', 'foo content');
        // TODO do we need to test with file as well?
        // formData.append('file', '<how to do this>');
        rpc
          .request('test', formData)
          .then(([url, options]) => {
            expect(url).toBe('/api/test?localeCode=el-GR');
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe(undefined);
            // In tests or log, this will show up as `{}`. Don't be fooled~
            expect(options.body).toBe(formData);
            expect(Array.from(options.body.entries())).toEqual([
              ['random', 'some-random'],
              ['foo', 'foo content'],
            ]);
            done();
          })
          .catch(e => {
            // $FlowFixMe
            done.fail(e);
          });

        wasResolved = true;
      },
    })
  );

  expect(wasResolved).toBeTruthy();
});

test('failure status request', done => {
  const mockFetchAsFailure = () =>
    Promise.resolve({
      json: () => ({status: 'failure', data: 'failure data'}),
    });
  const mockEmitter = createMockEmitter({
    emit(type, payload) {
      expect(type).toBe('rpc:method-client');
      expect(payload.method).toBe('test');
      expect(payload.status).toBe('failure');
      expect(typeof payload.timing).toBe('number');
      expect(payload.error).toBe('failure data');
    },
  });

  const app = createTestFixture();
  // $FlowFixMe
  app.register(FetchToken, mockFetchAsFailure);
  // $FlowFixMe
  app.register(UniversalEventsToken, mockEmitter);

  let wasResolved = false;
  getSimulator(
    app,
    createPlugin({
      deps: {rpcFactory: MockPluginToken},
      provides: deps => {
        const rpc = deps.rpcFactory.from({
          memoized: new Map(),
        });
        expect(typeof rpc.request).toBe('function');
        const testRequest = rpc.request('test');
        expect(testRequest instanceof Promise).toBeTruthy();
        testRequest
          .then(() => {
            // $FlowFixMe
            done.fail(() => new Error('should reject promise'));
          })
          .catch(e => {
            expect(e).toBe('failure data');
            done();
          });

        wasResolved = true;
      },
    })
  );

  expect(wasResolved).toBeTruthy();
});
