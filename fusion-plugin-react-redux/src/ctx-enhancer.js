/* eslint-env browser */

export default ctx => createStore => (...args) => {
  const store = createStore(...args);
  store.ctx = ctx;
  return store;
};
