import test from 'tape-cup';
import App from '../index';

test('interface', t => {
  const element = () => 'hi';
  const render = () => {};

  const app = new App(element, render);
  t.ok(app.plugins instanceof Array, 'sets plugins');
  t.equal(typeof app.register, 'function', 'has a register function');
  t.ok(typeof app.callback === 'function', 'callback is function');
  t.ok(typeof app.callback() === 'function', 'callback returns server handler');
  t.end();
});
