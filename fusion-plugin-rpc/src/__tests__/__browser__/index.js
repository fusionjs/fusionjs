import test from 'tape-cup';
import RPC from '../../browser';

test('success status request', t => {
  const fetch = (...args) =>
    Promise.resolve({json: () => ({status: 'success', data: args})});
  const rpc = RPC({fetch}).of();
  t.equals(typeof rpc.request, 'function', 'has method');
  t.ok(rpc.request('test') instanceof Promise, 'has right return type');
  rpc
    .request('test')
    .then(([url, options]) => {
      t.equals(url, '/api/test', 'has right url');
      t.equals(options.method, 'POST', 'has right http method');
      t.equals(
        options.headers['Content-Type'],
        'application/json',
        'has right content-type'
      );
      t.equals(options.body, '{}', 'has right body');
      t.end();
    })
    .catch(e => {
      t.fail(e);
    });
});

test('failure status request', t => {
  const fetch = () =>
    Promise.resolve({json: () => ({status: 'failure', data: 'failure data'})});
  const rpc = RPC({fetch}).of();
  t.equals(typeof rpc.request, 'function', 'has method');
  const testRequest = rpc.request('test');
  t.ok(testRequest instanceof Promise, 'has right return type');
  testRequest
    .then(() => {
      t.fail(new Error('should reject promise'));
    })
    .catch(e => {
      t.equal(e, 'failure data', 'should pass failure data through');
      t.end();
    });
});
