import { Context, constructContinueTx, constructStore, constructTake, passCwebFrom } from '@coinweb/contract-kit';

import { MakerDepositClaimBody, createMakerDepositKey } from '../../../../offchain/shared';
import { TypedClaim } from '../../../types';
import {
  constructSendCweb,
  createMakerDepositClaim,
  getCallParameters,
  getContractIssuer,
  getMethodArguments,
  getReadClaimByIndex,
  getUser,
} from '../../../utils';
import { isEqualUser } from '../../../utils/user';

import { WithdrawPrivateArguments } from './types';

export const withdraw = (context: Context) => {
  const { availableCweb } = getCallParameters(context);

  const [withdrawAmount] = getMethodArguments<WithdrawPrivateArguments>(context);

  const existedDepositClaim = getReadClaimByIndex<TypedClaim<MakerDepositClaimBody>>(context)(0);

  if (!existedDepositClaim || !isEqualUser(getUser(context), existedDepositClaim.body.owner)) {
    throw new Error('No deposit found');
  }

  const availableAmount = BigInt(existedDepositClaim.fees_stored);
  const requestedAmount = BigInt(withdrawAmount);

  const amountToWithdraw = availableAmount > requestedAmount ? requestedAmount : availableAmount;

  if (!amountToWithdraw) {
    return [];
  }

  const amountToStore = availableAmount > requestedAmount ? availableAmount - requestedAmount : 0n;

  const issuer = getContractIssuer(context);

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, availableCweb),
      constructTake(createMakerDepositKey(existedDepositClaim.body.owner)),
      constructStore(createMakerDepositClaim({ user: existedDepositClaim.body.owner, amount: amountToStore })),
      ...constructSendCweb(amountToWithdraw, existedDepositClaim.body.owner, null),
    ]),
  ];
};
