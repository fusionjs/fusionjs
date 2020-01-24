// @flow

import content from './worker2Import';

declare var self: DedicatedWorkerGlobalScope;

self.postMessage(content);
