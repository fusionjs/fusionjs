/* eslint-env browser,node */
import {applyMiddleware} from 'redux';

export default EventEmitter => {
  if (__DEV__ && !EventEmitter)
    throw new Error(`EventEmitter is required, but was: ${EventEmitter}`);

  const emitter = EventEmitter.of();
  const emit = payload => {
    emitter.emit('redux-action-emitter:action', payload);
  };

  const emitActionMiddleware = (/*store*/) => next => action => {
    emit(action);
    return next(action);
  };

  return applyMiddleware(emitActionMiddleware);
};
