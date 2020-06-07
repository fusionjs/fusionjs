// @flow

declare var self: DedicatedWorkerGlobalScope;

self.postMessage('worker1-included');
