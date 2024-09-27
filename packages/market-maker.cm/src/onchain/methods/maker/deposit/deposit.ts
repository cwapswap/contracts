import { Context, constructContinueTx, constructStore, constructTake, passCwebFrom } from '@coinweb/contract-kit';

import { MakerDepositClaimBody, createMakerDepositKey } from '../../../../offchain/shared';
import { TypedClaim } from '../../../types';
import {
  constructConditional,
  createMakerDepositClaim,
  getCallParameters,
  getContractIssuer,
  getMethodArguments,
  getReadClaimByIndex,
  getUser,
} from '../../../utils';

import { DepositPrivateArguments } from './types';

export const deposit = (context: Context) => {
  const { availableCweb } = getCallParameters(context);

  const [depositAmount] = getMethodArguments<DepositPrivateArguments>(context);

  const existedDepositClaim = getReadClaimByIndex<TypedClaim<MakerDepositClaimBody>>(context)(0);

  const totalDeposit = BigInt(depositAmount) + BigInt(existedDepositClaim?.fees_stored || 0);

  const issuer = getContractIssuer(context);
  const user = existedDepositClaim?.body.owner ?? getUser(context);

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, availableCweb),
      ...constructConditional(!!existedDepositClaim, constructTake(createMakerDepositKey(user))),
      constructStore(createMakerDepositClaim({ user, amount: totalDeposit })),
    ]),
  ];
};
