import tape from 'tape-cup';
import {compose} from '../compose';

const env = __BROWSER__ ? 'BROWSER' : 'NODE';

function testHelper(tapeFn) {
  return (name, testFn) => {
    return tapeFn(`${env} - ${name}`, testFn);
  };
}

const test = testHelper(tape);
test.only = testHelper(tape.only.bind(tape));
test.skip = testHelper(tape.skip.bind(tape));

export default test;

function getContext() {
  return __BROWSER__
    ? {}
    : {
        path: '/',
        headers: {
          accept: 'text/html',
        },
      };
}

export function run(app, ctx = {}) {
  ctx = Object.assign(getContext(), ctx);
  app.resolve();
  return compose(app.plugins)(ctx, () => Promise.resolve()).then(() => ctx);
}
