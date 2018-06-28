// @flow
import test from './test-helper';
import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {createPlugin} from '../create-plugin';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

test('app.cleanup with no cleanup plugins', async t => {
  const app = new App('el', el => el);
  app.register(
    createPlugin({
      provides: () => 'hello world',
      middleware: () => (ctx, next) => next(),
    })
  );
  app.resolve();
  await app.cleanup();
  t.ok('cleans up ok');
  t.end();
});

test('app.cleanup with async cleanup plugins', async t => {
  const app = new App('el', el => el);
  let firstCleanupCalled = false;
  let nextCleanupCalled = false;
  app.register(
    createPlugin({
      provides: () => 'hello world',
      cleanup: p => {
        firstCleanupCalled = true;
        t.equal(p, 'hello world', 'provides correct value to cleanup');
        return Promise.resolve();
      },
      middleware: () => (ctx, next) => next(),
    })
  );
  app.register(
    createPlugin({
      provides: () => 'another test',
      cleanup: p => {
        nextCleanupCalled = true;
        t.equal(p, 'another test', 'provides correct value to cleanup');
        return Promise.resolve();
      },
      middleware: () => (ctx, next) => next(),
    })
  );
  app.resolve();
  t.notOk(firstCleanupCalled, 'resolve() does not call cleanups');
  t.notOk(nextCleanupCalled, 'resolve() does not call cleanups');
  await app.cleanup();
  t.ok(firstCleanupCalled, 'calls all cleanups');
  t.ok(nextCleanupCalled, 'calls all cleanups');
  t.end();
});

test('app.cleanup does not cleanup if cleanup was not given a function', async t => {
  const app = new App('el', el => el);
  app.register(
    createPlugin({
      provides: () => 'hello world',
      // $FlowFixMe - Ignore this to test branch
      cleanup: 'notafunc',
      middleware: () => (ctx, next) => next(),
    })
  );
  app.resolve();
  await app.cleanup();
  t.end();
});
