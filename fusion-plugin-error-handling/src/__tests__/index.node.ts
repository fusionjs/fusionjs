/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-env node */

import {fork} from 'child_process';

import App, {consumeSanitizedHTML, html} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';

import ErrorHandling, {ErrorHandlerToken, getError} from '../server';

test('request errors', async () => {
  expect.assertions(6);

  const app = new App('test', (el) => el);

  let called = 0;
  const expectedTypes = ['browser', 'request'];
  const onError = (body, type, ctx) => {
    expect(type).toBe(expectedTypes.shift());
    expect(ctx).toBeTruthy();
    called++;
  };
  app.register(ErrorHandling);
  app.register(ErrorHandlerToken, onError);
  app.middleware(() => Promise.reject('REJECTED'));

  await getSimulator(app)
    .request('/_errors', {
      body: {message: 'test'},
    })
    .catch((e) => {
      expect(e).toBe('REJECTED');
    });

  expect(called).toBe(2);
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');
});

test('request errors send early response', async () => {
  expect.assertions(2);

  const app = new App('test', (el) => el);

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
    .catch((e) => {
      expect(e).toBe('REJECTED');
    });
  expect(called).toBe(1);
});

test('adds script', async () => {
  const app = new App('test', (el) => el);

  app.register(ErrorHandling);
  app.register(ErrorHandlerToken, () => {});

  const ctx = await await getSimulator(app).render('/');
  expect(
    consumeSanitizedHTML(ctx.template.head[0]).match(/<script/)
  ).toBeTruthy();
});

test('Uncaught exceptions', (done) => {
  const forked = fork('./fixtures/uncaught-exception.js', {stdio: 'pipe'});
  let stdout = '';
  forked.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  forked.on('close', (code) => {
    expect(code).toBe(1);
    expect(stdout.includes('ERROR HANDLER')).toBeTruthy();
    done();
  });
});

test('Unhandled rejections', (done) => {
  const forked = fork('./fixtures/unhandled-rejection.js', {stdio: 'pipe'});
  let stdout = '';
  forked.stdout.on('data', (data) => {
    stdout += data.toString();
  });
  forked.on('close', (code) => {
    expect(code).toBe(1);
    expect(stdout.includes('ERROR HANDLER')).toBeTruthy();
    done();
  });
});

test('Unhandled rejections with non-error does not wrap non-errors into Error instance', (done) => {
  const forked = fork('./fixtures/unhandled-rejection-non-error.js', {
    stdio: 'pipe',
  });
  let stdout = '';
  forked.stdout.on('data', (data) => {
    stdout += data.toString();
  });
  forked.on('close', (code) => {
    expect(code).toBe(1);
    expect(stdout.includes('ERROR HANDLER')).toBeTruthy();
    expect(stdout.includes('INSTANCEOF ERROR false')).toBeTruthy();
    done();
  });
});

test('getError function should not have any special HTML characters', () => {
  expect(consumeSanitizedHTML(html`${getError.toString()}`)).toEqual(
    getError.toString()
  );
});

test('getError formats different input types', () => {
  expect(getError({reason: 'I am reason'})).toMatchInlineSnapshot(`
    Object {
      "reason": "I am reason",
    }
  `);
  expect(getError('I am error')).toMatchInlineSnapshot(`"I am error"`);
  expect(getError(['I am error', 'Me too'])).toMatchInlineSnapshot(`
    Array [
      "I am error",
      "Me too",
    ]
  `);
  expect(getError(() => 'I am function')).toMatchInlineSnapshot(`[Function]`);
});
