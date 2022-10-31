/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import App, {html} from '../src/index';
import {run} from './test-helper';
import {SSRDeciderToken} from '../src/tokens';
import {createPlugin} from '../src/create-plugin';
import BaseApp from '../src/base-app';

test('ssr with accept header', async () => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
    return 'lol';
  };
  const app = new App(element, render);

  app.middleware(async (ctx, next) => {
    expect(ctx.element).toBe(element);
    expect(ctx.type).toBe('text/html');
    expect(typeof ctx.template).toBe('object');
    expect(typeof ctx.template.title).toBe('string');
    expect(typeof ctx.template.htmlAttrs).toBe('object');
    expect(typeof ctx.template.bodyAttrs).toBe('object');
    expect(ctx.template.head instanceof Array).toBeTruthy();
    expect(ctx.template.body instanceof Array).toBeTruthy();
    await next();
    expect(typeof ctx.template).toBe('object');
    expect(typeof ctx.template.title).toBe('string');
    expect(typeof ctx.template.htmlAttrs).toBe('object');
    expect(typeof ctx.template.bodyAttrs).toBe('object');
    expect(ctx.template.head instanceof Array).toBeTruthy();
    expect(ctx.template.body instanceof Array).toBeTruthy();
  });

  const ctx = await run(app);
  expect(typeof ctx.rendered).toBe('string');
  expect(typeof ctx.body).toBe('string');
  expect(!ctx.body.includes(element)).toBeTruthy();
  expect(flags.render).toBeTruthy();
});

test('ssr with bot user agent', async () => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
    return 'lol';
  };
  const app = new App(element, render);

  app.middleware(async (ctx, next) => {
    expect(ctx.element).toBe(element);
    expect(ctx.type).toBe('text/html');
    expect(typeof ctx.template).toBe('object');
    expect(typeof ctx.template.title).toBe('string');
    expect(typeof ctx.template.htmlAttrs).toBe('object');
    expect(typeof ctx.template.bodyAttrs).toBe('object');
    expect(ctx.template.head instanceof Array).toBeTruthy();
    expect(ctx.template.body instanceof Array).toBeTruthy();
    await next();
    expect(typeof ctx.template).toBe('object');
    expect(typeof ctx.template.title).toBe('string');
    expect(typeof ctx.template.htmlAttrs).toBe('object');
    expect(typeof ctx.template.bodyAttrs).toBe('object');
    expect(ctx.template.head instanceof Array).toBeTruthy();
    expect(ctx.template.body instanceof Array).toBeTruthy();
  });

  let initialCtx = {
    method: 'GET',
    headers: {
      accept: '*/*',
      'user-agent': 'AdsBot-Google',
    },
  };

  const ctx = await run(app, initialCtx);
  expect(typeof ctx.rendered).toBe('string');
  expect(typeof ctx.body).toBe('string');
  expect(!ctx.body.includes(element)).toBeTruthy();
  expect(flags.render).toBeTruthy();
});

test('POST request with bot user agent', async () => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
    return 'lol';
  };
  const app = new App(element, render);

  app.middleware(async (ctx, next) => {
    expect(ctx.element).toBeFalsy();
    ctx.body = 'OK';
    await next();
  });

  let initialCtx = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'user-agent': 'AdsBot-Google',
    },
  };

  const ctx = await run(app, initialCtx);
  expect(ctx.rendered).toBeFalsy();
  expect(ctx.body).toBe('OK');
  expect(flags.render).toBe(false);
});

test('ssr without valid accept header', async () => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };
  const app = new App(element, render);
  let initialCtx = {
    method: 'GET',
    headers: {accept: '*/*'},
  };

  const ctx = await run(app, initialCtx);
  expect(ctx.element).toBeFalsy();
  expect(ctx.type).toBeFalsy();
  expect(ctx.body).toBeFalsy();
  expect(!flags.render).toBeTruthy();
  expect(ctx.body).toBeFalsy();
});

test('ssr without valid bot user agent', async () => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };
  const app = new App(element, render);
  let initialCtx = {
    method: 'GET',
    headers: {
      accept: '*/*',
      'user-agent': 'test',
    },
  };

  const ctx = await run(app, initialCtx);
  expect(ctx.element).toBeFalsy();
  expect(ctx.type).toBeFalsy();
  expect(ctx.body).toBeFalsy();
  expect(!flags.render).toBeTruthy();
  expect(ctx.body).toBeFalsy();
});

test('disable SSR by composing SSRDecider with a plugin', async () => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };

  function buildApp() {
    const app = new App(element, render);

    app.middleware((ctx, next) => {
      ctx.body = '_NO_SSR_';
      return next();
    });

    const SSRDeciderEnhancer = (ssrDecider) => {
      return createPlugin({
        provides: () => {
          return (ctx) => {
            return (
              ssrDecider(ctx) &&
              !ctx.path.startsWith('/foo') &&
              !ctx.path.startsWith('/bar')
            );
          };
        },
      });
    };
    app.enhance(SSRDeciderToken, SSRDeciderEnhancer);
    return app;
  }

  let initialCtx = {
    method: 'GET',
    path: '/foo',
  };
  const ctx = await run(buildApp(), initialCtx);

  expect(ctx.element).toBeFalsy();
  expect(ctx.type).toBeFalsy();
  expect(!flags.render).toBeTruthy();
  expect(ctx.body).toBe('_NO_SSR_');

  let validSSRPathCtx = {
    path: '/some-path',
  };
  const renderCtx = await run(buildApp(), validSSRPathCtx);
  expect(renderCtx.element).toBe(element);
  expect(renderCtx.type).toBe('text/html');
});

test('disable SSR by composing SSRDecider with a function', async () => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };

  function buildApp() {
    const app = new App(element, render);

    app.middleware((ctx, next) => {
      ctx.body = '_NO_SSR_';
      return next();
    });

    app.enhance(
      SSRDeciderToken,
      (decide) => (ctx) => decide(ctx) && !ctx.path.startsWith('/foo')
    );
    return app;
  }

  let initialCtx = {
    method: 'GET',
    path: '/foo',
  };
  const ctx = await run(buildApp(), initialCtx);

  expect(ctx.element).toBeFalsy();
  expect(ctx.type).toBeFalsy();
  expect(!flags.render).toBeTruthy();
  expect(ctx.body).toBe('_NO_SSR_');

  let validSSRPathCtx = {
    path: '/some-path',
  };
  const renderCtx = await run(buildApp(), validSSRPathCtx);
  expect(renderCtx.element).toBe(element);
  expect(renderCtx.type).toBe('text/html');
});

test('SSR extension handling', async () => {
  const extensionToSSRSupported = {
    'js.map': false,
    svg: false,
    js: false,
    gif: false,
    jpg: false,
    png: false,
    pdf: false,
    json: false,
    html: true,
  };

  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
  };

  function buildApp() {
    const app = new App(element, render);
    return app;
  }

  for (let i in extensionToSSRSupported) {
    flags.render = false;
    let initialCtx = {
      method: 'GET',
      path: `/some-path.${i}`,
    };
    await run(buildApp(), initialCtx);
    const shouldSSR = extensionToSSRSupported[i];
    expect(flags.render).toBe(shouldSSR);
  }
});

test('SSR with redirects downstream', async () => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
    return 'lol';
  };
  const app = new App(element, render);

  app.middleware(async (ctx, next) => {
    expect(ctx.element).toBe(element);
    expect(ctx.type).toBe('text/html');
    expect(typeof ctx.template).toBe('object');
    expect(typeof ctx.template.title).toBe('string');
    expect(typeof ctx.template.htmlAttrs).toBe('object');
    expect(typeof ctx.template.bodyAttrs).toBe('object');
    expect(ctx.template.head instanceof Array).toBeTruthy();
    expect(ctx.template.body instanceof Array).toBeTruthy();
    ctx.status = 302;
    ctx.body = 'redirect';
    await next();
    expect(typeof ctx.template).toBe('object');
    expect(typeof ctx.template.title).toBe('string');
    expect(typeof ctx.template.htmlAttrs).toBe('object');
    expect(typeof ctx.template.bodyAttrs).toBe('object');
    expect(ctx.template.head instanceof Array).toBeTruthy();
    expect(ctx.template.body instanceof Array).toBeTruthy();
  });
  const ctx = await run(app);
  expect(ctx.status).toBe(302);
  expect(ctx.rendered).toBeFalsy();
  expect(typeof ctx.body).toBe('string');
  expect(flags.render).toBeFalsy();
});

test('SSR with redirects upstream', async () => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
    return 'lol';
  };
  const app = new App(element, render);

  app.middleware(async (ctx, next) => {
    expect(ctx.element).toBe(element);
    expect(ctx.type).toBe('text/html');
    expect(typeof ctx.template).toBe('object');
    expect(typeof ctx.template.title).toBe('string');
    expect(typeof ctx.template.htmlAttrs).toBe('object');
    expect(typeof ctx.template.bodyAttrs).toBe('object');
    expect(ctx.template.head instanceof Array).toBeTruthy();
    expect(ctx.template.body instanceof Array).toBeTruthy();
    await next();
    ctx.status = 302;
    ctx.body = 'redirect';
    expect(typeof ctx.template).toBe('object');
    expect(typeof ctx.template.title).toBe('string');
    expect(typeof ctx.template.htmlAttrs).toBe('object');
    expect(typeof ctx.template.bodyAttrs).toBe('object');
    expect(ctx.template.head instanceof Array).toBeTruthy();
    expect(ctx.template.body instanceof Array).toBeTruthy();
  });
  const ctx = await run(app);
  expect(ctx.status).toBe(302);
  expect(ctx.rendered).toBe('lol');
  expect(typeof ctx.body).toBe('string');
  expect(flags.render).toBeTruthy();
});

test('HTML escaping works', async () => {
  const element = 'hi';
  const render = (el) => el;
  const template = (ctx, next) => {
    ctx.template.htmlAttrs = {lang: '">'};
    ctx.template.bodyAttrs = {test: '">'};
    ctx.template.title = '</title>';
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);

  const ctx = await run(app);
  expect(ctx.body.includes('<html lang="\\u0022\\u003E">')).toBeTruthy();
  expect(ctx.body.includes('<body test="\\u0022\\u003E">')).toBeTruthy();
  expect(ctx.body.includes('<title>\\u003C/title\\u003E</title>')).toBeTruthy();
});

test('head and body must be sanitized', async () => {
  const element = 'hi';
  const render = (el) => el;
  const template = (ctx, next) => {
    ctx.template.head.push(html` <meta charset="${'">'}" /> `);
    ctx.template.body.push(html` <div>${'">'}</div> `);
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);

  const ctx = await run(app);
  expect(ctx.body.includes('<meta charset="\\u0022\\u003E" />')).toBeTruthy();
  expect(ctx.body.includes('<div>\\u0022\\u003E</div>')).toBeTruthy();
});

test('throws if head is not sanitized', async () => {
  const element = 'hi';
  const render = (el) => el;
  const template = (ctx, next) => {
    ctx.template.head.push(`<meta charset="${'">'}" />`);
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);

  let error;
  try {
    await run(app);
  } catch (e) {
    error = e;
  }
  expect(error).toMatchInlineSnapshot(
    `[Error: Unsanitized html. Use html\`<meta charset="">" />\`]`
  );
});

test('throws if body is not sanitized', async () => {
  const element = 'hi';
  const render = (el) => el;
  const template = (ctx, next) => {
    ctx.template.body.push(`<meta charset="${'">'}" />`);
    return next();
  };
  const app = new App(element, render);
  app.middleware(template);

  let error;
  try {
    await run(app);
  } catch (e) {
    error = e;
  }
  expect(error).toMatchInlineSnapshot(
    `[Error: Unsanitized html. Use html\`<meta charset="">" />\`]`
  );
});

test('rendering error handling', async () => {
  const element = 'hi';
  const render = () => {
    return new Promise(() => {
      throw new Error('Test error');
    });
  };
  const app = new App(element, render);
  await expect(run(app)).rejects.toThrow('Test error');
});

test('app handles no render token', () => {
  const app = new BaseApp('el', (el) => el);
  app.renderer = null;
  expect(() => app.resolve()).toThrowError(
    'Missing registration for RenderToken'
  );
});

test('enable proxy flag', () => {
  const flags = {render: false};
  const element = 'hi';
  const render = () => {
    flags.render = true;
    return 'lol';
  };
  const app = new App(element, render);
  expect(app._app.proxy).toBe(true);
});
