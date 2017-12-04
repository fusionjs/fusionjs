import test from 'tape-cup';
import App, {html} from '../../index';
import {compose} from '../../plugin/index.js';

test('ssr with accept header', async t => {
  const flags = {render: false, next: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };
  const app = new App(element, render);

  const ssr = app.plugins[1];

  const ctx = {
    headers: {accept: 'text/html'},
    path: '/',
    element: null,
    type: null,
    body: null,
  };
  try {
    await ssr(ctx, async () => {
      flags.next = true;
      t.equals(ctx.element, element, 'sets ctx.element');
      t.equals(ctx.type, 'text/html', 'sets ctx.type');
      t.equals(typeof ctx.body, 'object', 'sets ctx.body');
      t.equals(typeof ctx.body.title, 'string', 'sets ctx.body.title');
      t.equals(typeof ctx.body.htmlAttrs, 'object', 'ctx.body.htmlAttrs');
      t.ok(ctx.body.head instanceof Array, 'ctx.body.head');
      t.ok(ctx.body.body instanceof Array, 'ctx.body.body');
      t.equals(typeof ctx.rendered, 'string', 'ctx.rendered');
    });
  } catch (e) {
    t.ifError(e, 'should not error');
  }
  t.ok(flags.next, 'calls next');
  t.ok(!flags.render, 'does not call render');
  t.equals(typeof ctx.body, 'string', 'renders ctx.body to string');
  t.ok(!ctx.body.includes(element), 'does not renders element into ctx.body');

  t.end();
});
test('ssr without valid accept header', async t => {
  const flags = {render: false, next: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };
  const app = new App(element, render);

  const ssr = app.plugins[1];

  const ctx = {
    path: '/',
    headers: {accept: '*/*'},
    element: null,
    type: null,
    body: null,
  };
  try {
    await ssr(ctx, async () => {
      flags.next = true;
      t.equals(ctx.element, null, 'does not set ctx.element');
      t.equals(ctx.type, null, 'does not set ctx.type');
      t.equals(ctx.body, null, 'does not set ctx.body');
    });
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.ok(flags.next, 'calls next');
  t.ok(!flags.render, 'does not call render');
  t.equals(ctx.body, null, 'does not render ctx.body to string');

  t.end();
});
test('HTML escaping works', async t => {
  const element = 'hi';
  const render = el => el;
  const template = () => (ctx, next) => {
    ctx.body.htmlAttrs = {lang: '">'};
    ctx.body.title = '</title>';
    return next();
  };
  const app = new App(element, render);
  app.plugin(template);

  const middleware = compose(app.plugins);

  const ctx = {
    path: '/',
    headers: {accept: 'text/html'},
    element: null,
    type: null,
    body: null,
  };
  try {
    await middleware(ctx, () => Promise.resolve());
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.ok(ctx.body.includes('<html lang="\\u0022\\u003E">'), 'lang works');
  t.ok(
    ctx.body.includes('<title>\\u003C\\u002Ftitle\\u003E</title>'),
    'title works'
  );

  t.end();
});
test('head and body must be sanitized', async t => {
  const element = 'hi';
  const render = el => el;
  const template = () => (ctx, next) => {
    ctx.body.head.push(html`<meta charset="${'">'}" />`);
    ctx.body.body.push(html`<div>${'">'}</div>`);
    return next();
  };
  const app = new App(element, render);
  app.plugin(template);

  const middleware = compose(app.plugins);

  const ctx = {
    path: '/',
    headers: {accept: 'text/html'},
    element: null,
    type: null,
    body: null,
  };
  try {
    await middleware(ctx, () => Promise.resolve());
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.ok(ctx.body.includes('<meta charset="\\u0022\\u003E" />'), 'head works');
  t.ok(ctx.body.includes('<div>\\u0022\\u003E</div>'), 'body works');

  t.end();
});
test('head throws if not sanitized', async t => {
  const element = 'hi';
  const render = el => el;
  const template = () => (ctx, next) => {
    ctx.body.head.push(`<meta charset="${'">'}" />`);
    return next();
  };
  const app = new App(element, render);
  app.plugin(template);

  const middleware = compose(app.plugins);

  const ctx = {
    path: '/',
    headers: {accept: 'text/html'},
    element: null,
    type: null,
    body: null,
  };
  middleware(ctx, () => Promise.resolve()).catch(() => {
    t.pass('throws if head is not sanitized');
    t.end();
  });
});
test('body throws if not sanitized', async t => {
  const element = 'hi';
  const render = el => el;
  const template = () => (ctx, next) => {
    ctx.body.body.push(`<meta charset="${'">'}" />`);
    return next();
  };
  const app = new App(element, render);
  app.plugin(template);

  const middleware = compose(app.plugins);

  const ctx = {
    path: '/',
    headers: {accept: 'text/html'},
    element: null,
    type: null,
    body: null,
  };
  middleware(ctx, () => Promise.resolve()).catch(() => {
    t.pass('throws if body is not sanitized');
    t.end();
  });
});
test('renderer with element', async t => {
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
    path: '/',
    element,
    type: 'text/html',
    body: {body: []},
  };
  try {
    await renderer(ctx, async () => {
      flags.next = true;
    });
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.ok(flags.next, 'calls next');
  t.ok(flags.render, 'calls render');
  t.equals(typeof ctx.body, 'object', 'does not render ctx.body to string');
  t.equals(ctx.rendered, element, 'renders element into ctx.body');

  t.end();
});

test('renderer without element', async t => {
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
    path: '/',
    element: null,
    type: null,
    body: null,
  };
  try {
    await renderer(ctx, async () => {
      flags.next = true;
    });
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.ok(flags.next, 'calls next');
  t.ok(!flags.render, 'does not call render');
  t.equals(ctx.body, null, 'does not touch ctx.body');

  t.end();
});
