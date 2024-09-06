import {
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
  selfCallWrapper,
} from '@coinweb/contract-kit';

import {
  ACTIVITY_STATUS,
  PAYMENT_STATUS,
  PositionFundsClaimBody,
  PositionStateClaimBody,
  createPositionFundsKey,
  toHex,
} from '../../../../offchain/shared';
import { TypedClaim } from '../../../types';
import { constructSendCweb, createClosedIndexClaim, createPositionStateClaim } from '../../../utils';

export const closePosition = selfCallWrapper((context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const [, positionId, positionData] = getMethodArguments(context) as [
    unknown,
    string,
    Pick<
      PositionStateClaimBody,
      'baseAmount' | 'createdAt' | 'quoteAmount' | 'recipient' | 'expirationDate' | 'chainData' | 'txId'
    >,
  ];

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

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, availableCweb),
      constructTake(createPositionFundsKey(positionId)),
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
});
