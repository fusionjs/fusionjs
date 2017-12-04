import tape from 'tape-cup';
import mock from '../mock';

tape('mock with missing handler', async t => {
  const rpc = mock({handlers: {}}).of();
  try {
    await rpc.request('test');
  } catch (e) {
    t.equal(e.message, 'Missing RPC handler for test');
  } finally {
    t.end();
  }
});

tape('mock with no handlers', t => {
  try {
    const rpc = mock().of();
    t.equal(typeof rpc.request, 'function');
  } catch (e) {
    t.ifError(e);
  } finally {
    t.end();
  }
});

tape('mock with handler', async t => {
  const rpc = mock({
    handlers: {
      test: args => {
        t.deepLooseEqual(args, {test: 'args'});
        return 10;
      },
    },
  }).of();
  try {
    const result = await rpc.request('test', {test: 'args'});
    t.equal(result, 10);
  } catch (e) {
    t.ifError(e);
  } finally {
    t.end();
  }
});
