import { ClaimKey, User } from '@coinweb/contract-kit';

import { Key } from '../constants';

export const createMakerStateFirstPart = () => [Key.MAKER_STATE];
export const createMakerDepositFirstPart = () => [Key.MAKER_AVAILABLE_BALANCE];

export const createMakerStateKey = (id: string) =>
  ({
    first_part: createMakerStateFirstPart(),
    second_part: [id],
  }) satisfies ClaimKey;

export const createMakerDepositKey = (user: User) =>
  ({
    first_part: createMakerDepositFirstPart(),
    second_part: [user],
  }) satisfies ClaimKey;
