import ClientAppFactory from '../client-app';
import ServerAppFactory from '../server-app';
import {createPlugin} from '../create-plugin';

const App = __BROWSER__ ? ClientAppFactory() : ServerAppFactory();

test('app.cleanup with no cleanup plugins', async () => {
  const app = new App('el', (el) => el);
  app.register(
    createPlugin({
      provides: () => 'hello world',
      middleware: () => (ctx, next) => next(),
    })
  );
  app.resolve();
  await app.cleanup();
  expect('cleans up ok').toBeTruthy();
});

test('app.cleanup with async cleanup plugins', async () => {
  const app = new App('el', (el) => el);
  let firstCleanupCalled = false;
  let nextCleanupCalled = false;
  app.register(
    createPlugin({
      provides: () => 'hello world',
      cleanup: (p) => {
        firstCleanupCalled = true;
        expect(p).toBe('hello world');
        return Promise.resolve();
      },
      middleware: () => (ctx, next) => next(),
    })
  );
  app.register(
    createPlugin({
      provides: () => 'another test',
      cleanup: (p) => {
        nextCleanupCalled = true;
        expect(p).toBe('another test');
        return Promise.resolve();
      },
      middleware: () => (ctx, next) => next(),
    })
  );
  app.resolve();
  expect(firstCleanupCalled).toBeFalsy();
  expect(nextCleanupCalled).toBeFalsy();
  await app.cleanup();
  expect(firstCleanupCalled).toBeTruthy();
  expect(nextCleanupCalled).toBeTruthy();
});

test('app.cleanup does not cleanup if cleanup was not given a function', async () => {
  const app = new App('el', (el) => el);
  app.register(
    createPlugin({
      provides: () => 'hello world',
      // @ts-expect-error - Ignore this to test branch
      cleanup: 'notafunc',
      middleware: () => (ctx, next) => next(),
    })
  );
  app.resolve();
  await app.cleanup();
});
