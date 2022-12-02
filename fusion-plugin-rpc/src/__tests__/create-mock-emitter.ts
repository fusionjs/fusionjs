import type {IEmitter} from '../types';

function createMockEmitter<TProps>(props: TProps): IEmitter {
  const emitter = {
    from: () => {
      return emitter;
    },
    emit: () => {},
    setFrequency: () => {},
    teardown: () => {},
    map: () => {},
    on: () => {},
    off: () => {},
    mapEvent: () => {},
    handleEvent: () => {},
    flush: () => undefined,
    ...props,
  };
  return emitter;
}

export default createMockEmitter;
