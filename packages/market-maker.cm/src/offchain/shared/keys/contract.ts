import { ClaimKey } from '@coinweb/contract-kit';

import { Key } from '../constants';

export const createContractOwnerFirstPart = () => [Key.CONTRACT_OWNER];

export const createContractOwnerKey = () =>
  ({
    first_part: createContractOwnerFirstPart(),
    second_part: [],
  }) satisfies ClaimKey;
