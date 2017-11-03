import test from 'tape-cup';
import AppFactory from '../../client';

const App = AppFactory();

test('ssr', t => {
  const flags = {render: false, next: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };
  const app = new App(element, render);

  const ssr = app.plugins[1];

  const ctx = {
    element: null,
    body: null,
  };
  ssr(ctx, () => {
    flags.next = true;
    t.equals(ctx.element, element, 'sets ctx.element');
    t.equals(ctx.body, null, 'does not touch ctx.body');
    return Promise.resolve();
  }).then(() => {
    t.ok(flags.next, 'calls next');
    t.ok(!flags.render, 'does not call render');
    t.equals(ctx.body, null, 'does not touch ctx.body');

    t.end();
  });
});
test('renderer', t => {
  const flags = {render: false, next: false};
  const element = 'hi';
  const render = el => {
    flags.render = true;
    t.equals(el, element, 'render receives correct args');
    return el;
  };
  const app = new App(element, render);

  const renderer = app.plugins[app.plugins.length - 1];

  const ctx = {
    element,
    body: null,
  };
  renderer(ctx, () => {
    flags.next = true;
    return Promise.resolve();
  }).then(() => {
    t.ok(flags.next, 'calls next');
    t.ok(flags.render, 'calls render');
    t.equals(typeof ctx.rendered, 'string', 'renders into ctx.rendered');
    t.ok(ctx.rendered.includes(element), 'renders element into ctx.rendered');

    t.end();
  });
});
