/* eslint-env browser */
import {Plugin, unescape} from 'fusion-core';

export default function({fetch = window.fetch, hydrationState} = {}) {
  class I18n {
    constructor() {
      const {chunks, translations} =
        hydrationState || // this hook is mostly for testing
        JSON.parse(
          unescape(document.getElementById('__TRANSLATIONS__').textContent) // populated by plugin in ./node.js
        ) ||
        {};
      this.loadedChunks = chunks || [];
      this.translationMap = translations || {};
    }
    load(chunkIds) {
      const unloaded = chunkIds.filter(id => {
        return this.loadedChunks.indexOf(id) < 0;
      });
      if (unloaded.length > 0) {
        const ids = unloaded.join(',');
        // TODO(#3) don't append prefix if injected fetch also injects prefix
        return fetch(`/_translations?ids=${ids}`, {method: 'POST'})
          .then(r => r.json())
          .then(data => {
            for (const key in data) this.translationMap[key] = data[key];
            unloaded.forEach(id => {
              this.loadedChunks[id] = true;
            });
          });
      }
    }
    translate(key, interpolations = {}) {
      const template = this.translationMap[key];
      return template
        ? template.replace(/\${(.*?)}/g, (_, k) => interpolations[k])
        : key;
    }
  }
  return new Plugin({Service: I18n});
}
