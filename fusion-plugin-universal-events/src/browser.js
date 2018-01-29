/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */
import {createPlugin} from 'fusion-core';
import {FetchToken} from 'fusion-tokens';
import Emitter from './emitter';

class UniversalEmitter extends Emitter {
  constructor(fetch) {
    super();
    //privates
    this.batch = [];
    this.flush = this.flush.bind(this);
    this.fetch = fetch;
    this.setFrequency(5000);
    addEventListener('beforeunload', this.flush);
  }
  setFrequency(frequency) {
    clearInterval(this.interval);
    this.interval = setInterval(this.flush, frequency);
  }
  emit(type, payload) {
    payload = super.mapEvent(type, payload);
    super.handleEvent(type, payload);
    this.batch.push({type, payload});
  }
  // match server api
  from() {
    return this;
  }
  flush() {
    if (this.batch.length > 0) {
      this.fetch('/_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({items: this.batch} || []),
      }).catch(() => {});
    }
    this.batch = [];
  }
  teardown() {
    removeEventListener('beforeunload', this.flush);
    clearInterval(this.interval);
    this.interval = null;
    this.batch = [];
  }
}

const plugin =
  __BROWSER__ &&
  createPlugin({
    deps: {fetch: FetchToken},
    provides: ({fetch}) => {
      return new UniversalEmitter(fetch);
    },
  });

export default plugin;
