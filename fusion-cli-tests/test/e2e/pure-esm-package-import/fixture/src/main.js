// @noflow
import App from 'fusion-core';
import pureEsm from 'fixture-pure-esm-pkg';

export default async function () {
  return new App('element', () => {
    return pureEsm;
  });
};
