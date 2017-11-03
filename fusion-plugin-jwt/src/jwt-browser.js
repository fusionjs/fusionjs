export default function({secret} = {}) {
  if (__DEV__ && secret) {
    throw new Error('Do not pass JWT session secret to the client');
  }
}
