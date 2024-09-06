import { getKeyPair } from '@coinweb/testing-sdk';

import { instances } from './contract';
import { testCreatePosition } from './methods';

instances.forEach((instance, i) => {
  if (i) {
    return;
  }
  const keys = getKeyPair();

  describe(`Test ${instance.alias}`, () => {
    testCreatePosition(instance, keys.privateKey);
  });
});
