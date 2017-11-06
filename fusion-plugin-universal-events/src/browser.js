// MIT License

// Copyright (c) 2017 Uber Technologies, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/* eslint-env browser */
import {SingletonPlugin} from 'fusion-core';
import Emitter from './emitter';

export default function({fetch = window.fetch, global = window} = {}) {
  return new SingletonPlugin({
    Service: class UniversalEmitter extends Emitter {
      constructor() {
        super();
        //privates
        this.batch = [];
        this.flush = this.flush.bind(this);
        this.setFrequency(5000);
        global.addEventListener('beforeunload', this.flush);
      }
      setFrequency(frequency) {
        global.clearInterval(this.interval);
        this.interval = global.setInterval(this.flush, frequency);
      }
      emit(type, payload) {
        this.batch.push(super.emit(type, payload));
      }
      flush() {
        if (this.batch.length > 0) {
          fetch('/_events', {
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
        global.removeEventListener('beforeunload', this.flush);
        global.clearInterval(this.interval);
        this.interval = null;
        this.batch = [];
      }
    },
  });
}
