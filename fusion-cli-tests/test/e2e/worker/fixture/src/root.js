// @flow

import React from 'react';
import {assetUrl, workerUrl} from 'fusion-core';

export default class Root extends React.Component<*, *> {
  worker1Content: ?HTMLElement;
  worker2Content: ?HTMLElement;

  componentDidMount() {
    const worker = new Worker(workerUrl('./worker.js'));
    const worker2 = new Worker(workerUrl('./worker2.js'));
    worker.onmessage = event => {
      if (
        this.worker1Content instanceof HTMLElement &&
        typeof event.data === 'string'
      ) {
        this.worker1Content.innerHTML = event.data;
      }
    };
    worker2.onmessage = event => {
      if (
        this.worker2Content instanceof HTMLElement &&
        typeof event.data === 'string'
      ) {
        this.worker2Content.innerHTML = event.data;
      }
    };
  }

  render() {
    return (
      <div>
        <div id="worker-content-1" ref={el => (this.worker1Content = el)} />
        <div id="worker-content-2" ref={el => (this.worker2Content = el)} />
      </div>
    );
  }
}
