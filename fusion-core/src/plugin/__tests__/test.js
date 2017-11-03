import tape from 'tape-cup';

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
