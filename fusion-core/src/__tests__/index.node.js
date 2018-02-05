import test from 'tape-cup';
import App, {html} from '../index';
import {run} from './test-helper';

test('ssr with accept header', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
    return 'lol';
  };
  const app = new App(element, render);

  app.middleware(async (ctx, next) => {
    t.equals(ctx.element, element, 'sets ctx.element');
    t.equals(ctx.type, 'text/html', 'sets ctx.type');
    t.equals(typeof ctx.template, 'object', 'sets ctx.template');
    t.equals(typeof ctx.template.title, 'string', 'sets ctx.template.title');
    t.equals(typeof ctx.template.htmlAttrs, 'object', 'ctx.template.htmlAttrs');
    t.ok(ctx.template.head instanceof Array, 'ctx.template.head');
    t.ok(ctx.template.body instanceof Array, 'ctx.template.body');
    await next();
    t.equals(
      typeof ctx.template,
      'object',
      'ctx.template keeps structure on upstream'
    );
    t.equals(
      typeof ctx.template.title,
      'string',
      'ctx.template.title keeps structure on upstream'
    );
    t.equals(
      typeof ctx.template.htmlAttrs,
      'object',
      'ctx.template.htmlAttrs keeps structure on upstream'
    );
    t.ok(
      ctx.template.head instanceof Array,
      'ctx.template.head keeps structure on upstream'
    );
    t.ok(
      ctx.template.body instanceof Array,
      'ctx.template.body keeps structure on upstream'
    );
  });
  try {
    const ctx = await run(app);
    t.equals(typeof ctx.rendered, 'string', 'ctx.rendered');
    t.equals(typeof ctx.body, 'string', 'renders ctx.body to string');
    t.ok(!ctx.body.includes(element), 'does not renders element into ctx.body');
    t.ok(flags.render, 'calls render');
  } catch (e) {
    t.ifError(e, 'should not error');
  }
  t.end();
});

test('ssr without valid accept header', async t => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };
  const app = new App(element, render);
  let initialCtx = {
    headers: {accept: '*/*'},
  };
  try {
    const ctx = await run(app, initialCtx);
    t.notok(ctx.element, 'does not set ctx.element');
    t.notok(ctx.type, 'does not set ctx.type');
    t.notok(ctx.body, 'does not set ctx.body');
    t.ok(!flags.render, 'does not call render');
    t.notok(ctx.body, 'does not render ctx.body to string');
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('HTML escaping works', async t => {
  const element = 'hi';
  const render = el => el;
  const template = (ctx, next) => {
    ctx.template.htmlAttrs = {lang: '">'};
    ctx.template.title = '</title>';
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);

  try {
    const ctx = await run(app);
    t.ok(ctx.body.includes('<html lang="\\u0022\\u003E">'), 'lang works');
    t.ok(
      ctx.body.includes('<title>\\u003C\\u002Ftitle\\u003E</title>'),
      'title works'
    );
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('head and body must be sanitized', async t => {
  const element = 'hi';
  const render = el => el;
  const template = (ctx, next) => {
    ctx.template.head.push(html`<meta charset="${'">'}" />`);
    ctx.template.body.push(html`<div>${'">'}</div>`);
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);
  try {
    const ctx = await run(app);
    t.ok(ctx.body.includes('<meta charset="\\u0022\\u003E" />'), 'head works');
    t.ok(ctx.body.includes('<div>\\u0022\\u003E</div>'), 'body works');
  } catch (e) {
    t.ifError(e, 'does not error');
  }
  t.end();
});

test('throws if head is not sanitized', async t => {
  const element = 'hi';
  const render = el => el;
  const template = (ctx, next) => {
    ctx.template.head.push(`<meta charset="${'">'}" />`);
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);
  try {
    await run(app);
    t.fail('should throw');
  } catch (e) {
    t.ok(e, 'throws if head is not sanitized');
  }
  t.end();
});

test('throws if body is not sanitized', async t => {
  const element = 'hi';
  const render = el => el;
  const template = (ctx, next) => {
    ctx.template.body.push(`<meta charset="${'">'}" />`);
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);

  try {
    await run(app);
    t.fail('should throw');
  } catch (e) {
    t.ok(e, 'throws if body is not sanitized');
  }
  t.end();
});

test('rendering error handling', async t => {
  const element = 'hi';
  const render = () => {
    return new Promise(() => {
      throw new Error('Test error');
    });
  };
  const app = new App(element, render);
  try {
    await run(app);
  } catch (e) {
    t.equal(e.message, 'Test error');
    t.end();
  }
});
