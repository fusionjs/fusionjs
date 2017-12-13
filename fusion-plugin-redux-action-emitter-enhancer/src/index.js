/* eslint-env browser,node */
export default EventEmitter => {
  if (__DEV__ && !EventEmitter) {
    throw new Error(`EventEmitter is required, but was: ${EventEmitter}`);
  }

  return createStore => (...args) => {
    const store = createStore(...args);
    return {
      ...store,
      dispatch: action => {
        EventEmitter.of(store.ctx).emit('redux-action-emitter:action', action);
        return store.dispatch(action);
      },
    };
  };
};
