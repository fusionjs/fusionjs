import tape from 'tape-cup';
import Timing from '../../timing';

tape('timing plugin', t => {
  const ctx = {};
  const timing = Timing.of(ctx);
  checkTimingProp('end');
  checkTimingProp('upstream');
  checkTimingProp('downstream');
  checkTimingProp('render');
  function checkTimingProp(prop) {
    t.equal(
      typeof timing[prop].resolve,
      'function',
      `exposes a ${prop} resolve function`
    );
    t.equal(
      typeof timing[prop].reject,
      'function',
      `exposes a ${prop} reject function`
    );
    t.ok(
      timing[prop].promise instanceof Promise,
      `timing.${prop}.promise is a promise`
    );
  }
  Timing.middleware(ctx, () => {
    t.equal(typeof ctx.timing.start, 'number', 'sets up ctx.timing.start');
    t.ok(
      ctx.timing.end instanceof Promise,
      'sets up ctx.timing.end to be a promise'
    );
    ctx.timing.downstream.then(result => {
      t.equal(typeof result, 'number', 'sets downstream timing result');
    });
    ctx.timing.render.then(result => {
      t.equal(typeof result, 'number', 'sets render timing result');
    });
    ctx.timing.upstream.then(result => {
      t.equal(typeof result, 'number', 'sets upstream timing result');
    });
    ctx.timing.end.then(result => {
      t.equal(typeof result, 'number', 'sets end timing result');
      t.ok(result >= 10, 'result time is at least 10ms');
      t.ok(result <= 30, 'result time is no more than 30ms');
      t.end();
    });
    return new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  });
});
