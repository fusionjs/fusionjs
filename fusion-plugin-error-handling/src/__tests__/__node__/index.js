import test from 'tape-cup';
import ErrorHandling from '../../server';

test('works', async t => {
  let called = 0;
  const onError = () => {
    called++;
  };
  const Plugin = ErrorHandling({onError});
  await Plugin.middleware({}, () =>
    Promise.reject(new Error('server error'))
  ).catch(() => {});
  t.equals(called, 1, 'emits server error');

  const ctx = {
    path: '/_errors',
    prefix: '',
    request: {body: {message: 'test'}},
  };
  await Plugin.middleware(ctx, () => Promise.resolve());
  t.equals(called, 2, 'emits browser error');

  t.end();
});
