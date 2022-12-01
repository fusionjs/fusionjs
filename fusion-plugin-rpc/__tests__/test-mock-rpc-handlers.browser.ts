// @flow
import sinon from 'sinon';

import getMockRpcHandlers from '../src/mock-rpc-handlers.js';
import type {RpcResponseMap} from '../src/mock-rpc-handlers.js';
import ResponseError from '../src/response-error.js';

test('mockRpcHandlers', async () => {
  expect.assertions(4);
  const getUserFixture = {
    getUser: {
      firstName: 'John',
      lastName: 'Doe',
      uuid: 123,
    },
  };
  const updateUserFixture: {updateUser: RpcResponseMap | ResponseError} = {
    updateUser: [
      {
        args: [{firstName: 'Jane'}],
        response: {
          firstName: 'Jane',
          lastName: 'Doe',
          uuid: 123,
        },
      },
      {
        args: [{firstName: ''}],
        response: new ResponseError('Username cant be empty'),
      },
    ],
  };
  const rpcFixtures = [getUserFixture, updateUserFixture];

  const onMockRpcSpy = sinon.spy();

  const mockRpcHandlers = getMockRpcHandlers(rpcFixtures, onMockRpcSpy);

  const user = await mockRpcHandlers.getUser();

  expect(user).toEqual({
    firstName: 'John',
    lastName: 'Doe',
    uuid: 123,
  });

  expect(onMockRpcSpy.getCall(0).args).toEqual([
    'getUser',
    [],
    {
      firstName: 'John',
      lastName: 'Doe',
      uuid: 123,
    },
  ]);

  const updatedUser = await mockRpcHandlers.updateUser({firstName: 'Jane'});

  expect(updatedUser).toEqual({
    firstName: 'Jane',
    lastName: 'Doe',
    uuid: 123,
  });

  await expect(mockRpcHandlers.updateUser({firstName: ''})).rejects.toThrow(
    new Error('Username cant be empty')
  );
});
