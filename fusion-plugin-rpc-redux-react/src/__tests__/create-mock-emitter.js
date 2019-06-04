// @flow

export default function createMockEmitter(props: mixed) {
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
    flush: () => {},
    ...props,
  };
  return emitter;
}
