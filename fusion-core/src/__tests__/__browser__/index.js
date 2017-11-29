import test from 'tape-cup';
import AppFactory from '../../client';

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
  const flags = {render: false};
  const element = 'hi';
  const render = el => {
    flags.render = true;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, render);
  const callback = app.callback();
  t.equal(typeof callback, 'function');
  const ctx = await callback();
  t.equal(ctx.rendered, element);
  t.ok(flags.render, 'calls render');
  t.equal(ctx.element, element, 'sets ctx.element');
  t.end();
});
