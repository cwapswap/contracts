import type { Context } from '@coinweb/contract-kit';
import {
  getContractId,
  constructContractIssuer,
  getMethodArguments,
  extractContractInfo,
  extractUser,
  getAuthenticated,
  getParameters,
} from '@coinweb/contract-kit';

import { PositionStateClaimBody, ACTIVITY_STATUS, PAYMENT_STATUS, HexBigInt, FEE } from '../../../../offchain/shared';
import { CONSTANTS } from '../../../constants';
import { ContractConfig } from '../../../types';
import { createCheckPositionCall, hashClaimBody } from '../../../utils';

export const createPositionPublic = (context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const [, cwebAmount, l1Amount, recipientL1, providedOwnerFee, providedCallFee, ownerAddress] = getMethodArguments(
    context,
  ) as [unknown, HexBigInt, HexBigInt, string, string, string, string | undefined];

  const parameters = getParameters('contract/parameters.json') as ContractConfig;

  const ownerMinFee = BigInt(parameters.owner_min_fee || 0);
  const ownerPercentageFee = BigInt(parameters.owner_percentage_fee || 0);
  const positionAmount = BigInt(cwebAmount);

  const calculatedOwnerPercentageFee = (positionAmount * ownerPercentageFee) / 100n;

  const dueOwnerFee = calculatedOwnerPercentageFee > ownerMinFee ? calculatedOwnerPercentageFee : ownerMinFee;

  const dueCallFee = FEE.CREATE_POSITION;

  if (dueOwnerFee > BigInt(providedOwnerFee)) {
    throw new Error('Insufficient fee provided to owner'); //TODO! Return a rest of cweb to signer;
  }

  if (dueCallFee > BigInt(providedCallFee)) {
    throw new Error('Insufficient fee provided'); //TODO! Return a rest of cweb to signer;
  }

  if (positionAmount + dueCallFee + dueOwnerFee > availableCweb) {
    throw new Error('Insufficient cweb provided'); //TODO! Return a rest of cweb to signer;
  }

  const signer = ownerAddress || (extractUser(getAuthenticated(tx)).payload as string);

  const createdAt = Date.now();

  const positionState: PositionStateClaimBody = {
    recipient: recipientL1,
    baseAmount: cwebAmount,
    quoteAmount: l1Amount,
    activityStatus: ACTIVITY_STATUS.ACTIVE,
    paymentStatus: PAYMENT_STATUS.PAYABLE,
    funds: cwebAmount,
    createdAt,
    expirationDate: createdAt + CONSTANTS.POSITION_LIFE_TIME,
  };

  const positionId = hashClaimBody(positionState);

  const issuer = constructContractIssuer(getContractId(tx));

  return createCheckPositionCall(
    context,
    issuer,
    positionId,
    [positionId, positionState, signer, providedOwnerFee],
    availableCweb,
    auth,
  );
};
