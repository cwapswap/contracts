import {
  ClaimKey,
  Context,
  constructContinueTx,
  constructContractIssuer,
  constructStore,
  constructTake,
  extractContractArgs,
  extractContractInfo,
  extractRead,
  getContractId,
  getMethodArguments,
  passCwebFrom,
} from '@coinweb/contract-kit';

import {
  ACTIVITY_STATUS,
  PAYMENT_STATUS,
  PositionFundsClaimBody,
  createBtcUtxoUniquenessKey,
  createPositionFundsKey,
  toHex,
} from '../../../../offchain/shared';
import { L1Types, TypedClaim } from '../../../types';
import {
  constructNonNullable,
  constructSendCweb,
  createClosedIndexClaim,
  createPositionStateClaim,
  getInstanceParameters,
  validateBtcChainData,
} from '../../../utils';

import { ClosePositionMethodArgs } from './types';

export const closePosition = (context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const [, positionId, positionData] = getMethodArguments(context) as [unknown, ...ClosePositionMethodArgs];

  const positionFundsClaim = extractRead(extractContractArgs(tx)[0])?.[0]
    ?.content as TypedClaim<PositionFundsClaimBody>;

  if (!positionFundsClaim) {
    throw new Error('Position is not active');
  }

  const positionStoredAmount = positionFundsClaim.fees_stored;
  const positionFunds = positionFundsClaim.body;

  const issuer = constructContractIssuer(getContractId(tx));

  const fundsOwner = positionFunds.owner;

  if (!fundsOwner) {
    throw new Error('Cannot return funds');
  }

  let uniquenessKey: null | ClaimKey;

  if (getInstanceParameters().l1_type === L1Types.Btc) {
    if (!validateBtcChainData(positionData.chainData)) {
      throw new Error('Invalid input data');
    }

    uniquenessKey = createBtcUtxoUniquenessKey(positionData.chainData);
  } else {
    uniquenessKey = null;
  }

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, availableCweb),
      constructTake(createPositionFundsKey(positionId)),
      ...constructNonNullable(uniquenessKey, (uniquenessKey) => [constructTake(uniquenessKey)]),
      ...constructSendCweb(BigInt(positionStoredAmount), fundsOwner, null),
      constructStore(
        createPositionStateClaim({
          id: positionId,
          body: {
            ...positionData,
            activityStatus: ACTIVITY_STATUS.CANCELLED,
            paymentStatus: PAYMENT_STATUS.NOT_PAYABLE,
            funds: toHex(0),
          },
        }),
      ),
      constructStore(createClosedIndexClaim({ positionId })),
    ]),
  ];
};
