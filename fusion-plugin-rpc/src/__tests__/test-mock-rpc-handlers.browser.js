// @flow
import test from 'tape-cup';
import sinon from 'sinon';
import getMockRpcHandlers from '../mock-rpc-handlers';
import ResponseError from '../response-error';

test('mockRpcHandlers', async t => {
  t.plan(4);
  const rpcFixtures = [
    {
      getUser: {
        firstName: 'John',
        lastName: 'Doe',
        uuid: 123,
      },
    },
    {
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
    },
  ];

  const onMockRpcSpy = sinon.spy();

  const mockRpcHandlers = getMockRpcHandlers(rpcFixtures, onMockRpcSpy);

  const user = await mockRpcHandlers.getUser();

  t.deepEqual(
    user,
    {
      firstName: 'John',
      lastName: 'Doe',
      uuid: 123,
    },
    'should return success response'
  );

  t.deepEqual(
    onMockRpcSpy.getCall(0).args,
    [
      'getUser',
      [],
      {
        firstName: 'John',
        lastName: 'Doe',
        uuid: 123,
      },
    ],
    'should call getUser rpc handler, with correct args and returns correct response'
  );

  const updatedUser = await mockRpcHandlers.updateUser({firstName: 'Jane'});

  t.deepEqual(
    updatedUser,
    {
      firstName: 'Jane',
      lastName: 'Doe',
      uuid: 123,
    },
    'should return error response '
  );

  try {
    await mockRpcHandlers.updateUser({firstName: ''});
  } catch (e) {
    t.ok(
      e instanceof Error && e.message === 'Username cant be empty',
      'should return error response '
    );
  }

  t.end();
});
