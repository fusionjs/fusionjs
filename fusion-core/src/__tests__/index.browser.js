import test from 'tape-cup';
import AppFactory from '../client';

const App = AppFactory();

test('app onerror', t => {
  const e = new Error('Some error');
  const app = new App('hello', () => {});
  try {
    app.onerror(e);
  } catch (error) {
    t.equal(error, e);
  } finally {
    t.end();
  }
});

test('app callback', async t => {
  let numRenders = 0;
  const element = 'hi';
  const render = el => {
    numRenders++;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, render);
  const callback = app.callback();
  t.equal(typeof callback, 'function');
  const ctx = await callback();
  t.equal(ctx.rendered, element);
  t.equal(numRenders, 1, 'calls render once');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});

test('throws rendering errors', async t => {
  const element = 'hi';
  const render = () => {
    return new Promise(() => {
      throw new Error('Test error');
    });
  };
  const app = new App(element, render);
  const callback = app.callback();

  try {
    await callback();
  } catch (e) {
    t.equal(e.message, 'Test error');
    t.end();
  }
});
