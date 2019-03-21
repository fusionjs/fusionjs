// @noflow
import App from 'fusion-core';

export default async function() {
  console.log('main __BROWSER__ is', __BROWSER__);
  console.log('main __DEV__ is', __DEV__);
  console.log('main __NODE__ is', __NODE__);
  return new App('el', el => el);
}
