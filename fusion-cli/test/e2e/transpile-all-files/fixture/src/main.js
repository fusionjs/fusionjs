// @noflow
import App from 'fusion-core';
import {Test} from '../common/test';

export default async function() {
  return new App(Test, el => el);
}
