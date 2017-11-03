import test from 'tape-cup';
import RPC from '../../browser';

test('works', t => {
  const fetch = (...args) => Promise.resolve({json: () => args});
  const hydrationState = ['test'];
  const rpc = RPC({fetch, hydrationState}).of();
  t.equals(typeof rpc.test, 'function', 'has method');
  t.ok(rpc.test() instanceof Promise, 'has right return type');
  rpc.test().then(([url, options]) => {
    t.equals(url, '/api/test', 'has right url');
    t.equals(options.method, 'POST', 'has right http method');
    t.equals(
      options.headers['Content-Type'],
      'application/json',
      'has right content-type'
    );
    t.equals(options.body, '{}', 'has right body');

    t.end();
  });
});
