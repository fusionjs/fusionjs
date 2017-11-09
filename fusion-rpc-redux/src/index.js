import {createReactor} from 'redux-reactors';

function camelUpper(key) {
  return key.replace(/([A-Z])/g, '_$1').toUpperCase();
}

const noopReducer = state => state;
const types = ['start', 'success', 'failure'];

function createActionNames(rpcId) {
  const rpcActionName = camelUpper(rpcId);
  return types.reduce((names, type) => {
    names[type] = `${rpcActionName}_${type.toUpperCase()}`;
    return names;
  }, {});
}

export function createRPCActions(rpcId) {
  const actionNames = createActionNames(rpcId);
  return types.reduce((obj, type) => {
    obj[type] = payload => {
      return {type: actionNames[type], payload};
    };
    return obj;
  }, {});
}

function getNormalizedReducers(reducers) {
  return types.reduce((obj, type) => {
    obj[type] = reducers[type] || noopReducer;
    return obj;
  }, {});
}

export function createRPCReducer(rpcId, reducers) {
  const actionNames = createActionNames(rpcId);
  reducers = getNormalizedReducers(reducers);

  return function rpcReducer(state = {}, action) {
    if (actionNames.start === action.type) {
      return reducers.start(state, action);
    }
    if (actionNames.success === action.type) {
      return reducers.success(state, action);
    }
    if (actionNames.failure === action.type) {
      return reducers.failure(state, action);
    }
    return state;
  };
}

export function createRPCReactors(rpcId, reducers) {
  const actionNames = createActionNames(rpcId);
  reducers = getNormalizedReducers(reducers);
  const reactors = types.reduce((obj, type) => {
    obj[type] = createReactor(actionNames[type], reducers[type]);
    return obj;
  }, {});
  return reactors;
}

export function createRPCHandler({
  actions,
  store,
  rpc,
  rpcId,
  mapStateToParams,
  transformParams,
}) {
  if (!actions) {
    actions = createRPCActions(rpcId);
  }
  return args => {
    if (mapStateToParams) {
      args = mapStateToParams(store.getState());
    }
    if (transformParams) {
      args = transformParams(args);
    }
    store.dispatch(actions.start(args));
    return rpc
      .request(rpcId, args)
      .then(result => {
        if (result.error) throw new Error(result.error);
        store.dispatch(actions.success(result));
        return result;
      })
      .catch(e => {
        store.dispatch(actions.failure(e));
        return e;
      });
  };
}
