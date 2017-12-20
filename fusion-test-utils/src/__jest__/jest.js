import {mockFunction, test} from '../index';

test('function mocks', assert => {
  const myMock = mockFunction();
  assert.equal(myMock.mock.calls.length, 0);
  myMock();
  assert.equal(myMock.mock.calls.length, 1);
});

test('matchSnapshot', assert => {
  const myObj = {foo: 'bar'};
  assert.matchSnapshot(myObj);
});
