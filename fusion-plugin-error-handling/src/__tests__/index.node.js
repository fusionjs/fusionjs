/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

import test from 'tape-cup';
import {fork} from 'child_process';

import App, {consumeSanitizedHTML} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import ErrorHandling, {ErrorHandlerToken} from '../server';

test('request errors', async t => {
  t.plan(6);

  const app = new App('test', el => el);

  let called = 0;
  const expectedTypes = ['browser', 'request'];
  const onError = (body, type, ctx) => {
    t.equal(type, expectedTypes.shift());
    t.ok(ctx);
    called++;
  };
  app.register(ErrorHandling);
  app.register(ErrorHandlerToken, onError);
  app.middleware(() => Promise.reject('REJECTED'));

  await getSimulator(app)
    .request('/_errors', {
      body: {message: 'test'},
    })
    .catch(e => {
      t.equals(e, 'REJECTED');
    });

  t.equals(called, 2, 'emits browser error');
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');

  t.end();
});

test('request errors send early response', async t => {
  t.plan(2);

  const app = new App('test', el => el);

  let called = 0;
  const onError = () => {
    called++;
    // return promise that will never resolve
    return new Promise(() => {});
  };
  app.register(ErrorHandling);
  app.register(ErrorHandlerToken, onError);
  app.middleware(() => Promise.reject('REJECTED'));
  await getSimulator(app)
    .request('/someRoute', {
      body: {message: 'test'},
    })
    .catch(e => {
      t.equals(e, 'REJECTED');
    });
  t.equals(called, 1, 'calls error handler without awaiting it');
  t.end();
});

test('adds script', async t => {
  const app = new App('test', el => el);

  app.register(ErrorHandling);
  app.register(ErrorHandlerToken, () => {});

  const ctx = await await getSimulator(app).render('/');
  t.ok(
    consumeSanitizedHTML(ctx.template.head[0]).match(/<script/),
    'adds script to head'
  );

  t.end();
});

test('Uncaught exceptions', async t => {
  // $FlowFixMe
  const forked = fork('./fixtures/uncaught-exception.js', {stdio: 'pipe'});
  let stdout = '';
  forked.stdout.on('data', data => {
    stdout += data.toString();
  });

  forked.on('close', code => {
    t.equal(code, 1, 'exits with code 1');
    t.ok(stdout.includes('ERROR HANDLER'), 'outputs expected error');
    t.end();
  });
});

test('Unhandled rejections', async t => {
  // $FlowFixMe
  const forked = fork('./fixtures/unhandled-rejection.js', {stdio: 'pipe'});
  let stdout = '';
  forked.stdout.on('data', data => {
    stdout += data.toString();
  });
  forked.on('close', code => {
    t.equal(code, 1, 'exits with code 1');
    t.ok(stdout.includes('ERROR HANDLER'), 'outputs expected error');
    t.end();
  });
});

test('Unhandled rejections with non-error', async t => {
  // $FlowFixMe
  const forked = fork('./fixtures/unhandled-rejection-non-error.js', {
    stdio: 'pipe',
  });
  let stdout = '';
  forked.stdout.on('data', data => {
    stdout += data.toString();
  });
  forked.on('close', code => {
    t.equal(code, 1, 'exits with code 1');
    t.ok(stdout.includes('ERROR HANDLER'), 'outputs expected error');
    t.ok(stdout.includes('INSTANCEOF ERROR true'), 'outputs expected error');
    t.end();
  });
});
