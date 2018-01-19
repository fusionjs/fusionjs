/* eslint-env node */
import App, {consumeSanitizedHTML} from 'fusion-core';
import test from 'tape-cup';
import {getSimulator} from 'fusion-test-utils';
import {fork} from 'child_process';
import ErrorHandling, {ErrorHandlerToken} from '../server';

test('request errors', async t => {
  t.plan(2);

  const app = new App('test', el => el);

  let called = 0;
  const onError = () => {
    called++;
  };
  app.register(ErrorHandling);
  app.register(ErrorHandlerToken, onError);
  app.middleware(() => Promise.reject('REJECTED'));

  await getSimulator(app)
    .request('/_errors', {
      prefix: '',
      request: {body: {message: 'test'}},
    })
    .catch(e => {
      t.equals(e, 'REJECTED');
    });

  t.equals(called, 1, 'emits browser error');
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
    .request('/_errors', {
      prefix: '',
      request: {body: {message: 'test'}},
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

  const ctx = await getSimulator(app).render('/');

  t.ok(
    consumeSanitizedHTML(ctx.template.head[0]).match(/<script/),
    'adds script to head'
  );

  t.end();
});

test('Uncaught exceptions', async t => {
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
