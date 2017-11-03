import test from 'tape-cup';
import App from '../../index';
import {compose} from '../../plugin/index.js';

test('interface', t => {
  const element = () => 'hi';
  const render = () => {};

  const app = new App(element, render);
  t.ok(app.plugins instanceof Array, 'sets plugins');
  t.ok(typeof app.callback === 'function', 'callback is function');
  t.ok(typeof app.callback() === 'function', 'callback returns server handler');
  t.end();
});
test('context composition', t => {
  const element = 'hello';
  const render = el => `<h1>${el}</h1>`;
  const wrap = () => (ctx, next) => {
    ctx.element = ctx.element.toUpperCase();
    return next();
  };
  const context = {
    headers: {accept: 'text/html'},
    path: '/',
    syncChunks: [],
    preloadChunks: [],
    chunkUrlMap: new Set(),
    webpackPublicPath: '/',
    element: null,
    rendered: null,
    render: null,
    type: null,
    body: null,
  };

  const app = new App(element, render);
  app.plugin(wrap);
  const middleware = compose(app.plugins);
  middleware(context, () => Promise.resolve())
    .then(() => {
      t.equals(typeof context.rendered, 'string', 'renders');
      t.ok(context.rendered.includes('<h1>HELLO</h1>'), 'has expected html');
      t.end();
    })
    .catch(e => {
      t.ifError(e, 'something went wrong');
      t.end();
    });
});
