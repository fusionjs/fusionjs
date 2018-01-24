import test from 'tape-cup';

import App, {createPlugin} from 'fusion-core';
import {getSimulator} from 'fusion-test-utils';
import {EnhancerToken} from 'fusion-plugin-react-redux';
import {UniversalEventsToken} from 'fusion-plugin-universal-events';
import ReduxActionEmitterEnhancer from '../index.js';

const eventsEmitted = [];
const mockEmitter = {
  emit: (type, payload) => {
    eventsEmitted.push({type, payload});
  },
  from: function() {
    return this;
  },
};

const mockEmitterPlugin = createPlugin({
  provides: () => mockEmitter,
});

function createTestFixture() {
  const app = new App('content', el => el);
  app.register(EnhancerToken, ReduxActionEmitterEnhancer);
  app.register(UniversalEventsToken, mockEmitterPlugin);
  return app;
}

test('plugin - service resolved as expected', t => {
  const app = createTestFixture();
  let wasResolved = false;

  getSimulator(
    app,
    createPlugin({
      deps: {enhancer: EnhancerToken},
      provides: deps => {
        const {enhancer} = deps;
        t.ok(enhancer);
        const createStore = () => {
          return {
            dispatch: () => {},
          };
        };
        const enhanced = enhancer(createStore)({});
        enhanced.dispatch();
        wasResolved = true;
      },
    })
  );

  t.true(wasResolved, 'test plugin was resolved');
  t.equal(eventsEmitted[0].type, 'redux-action-emitter:action');
  t.end();
});
