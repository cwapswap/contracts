import {
  Context,
  constructBlock,
  constructContinueTx,
  constructContractIssuer,
  constructRead,
  constructStore,
  constructTake,
  extractContractArgs,
  extractContractInfo,
  extractRead,
  extractUser,
  getContractId,
  getMethodArguments,
  getQueueAuthenticated,
  prepareQueueCall,
  queueCostFee,
} from '@coinweb/contract-kit';

import {
  ACTIVITY_STATUS,
  PositionFundsClaimBody,
  PositionStateClaimBody,
  createActivePositionIndexKey,
  createBestByQuoteActiveIndexKey,
  createPositionFundsKey,
} from '../../../../offchain/shared';
import { CONSTANTS, PRIVATE_METHODS } from '../../../constants';
import { TypedClaim } from '../../../types';
import {
  constructConditional,
  createClosedPositionBlockFilter,
  createExpirationPositionBlockFilter,
  createPositionStateClaim,
  createBestByQuoteIndex,
  getTime,
  isEqualUser,
} from '../../../utils';

import { ClosePositionMethodArgs } from './types';

export const deactivatePosition = (context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const [, positionId] = getMethodArguments(context) as [unknown, string];

  const contractArgs = extractContractArgs(tx);

  const positionClaim = extractRead(contractArgs[0])?.[0]?.content as TypedClaim<PositionStateClaimBody> | undefined;

  if (!positionClaim) {
    throw new Error('Position does not exist');
  }

  const positionFundsClaim = extractRead(contractArgs[1])?.[0]?.content as
    | TypedClaim<PositionFundsClaimBody>
    | undefined;

  if (!positionFundsClaim) {
    throw new Error('Position is not active');
  }

  const positionState = positionClaim.body;

  const { owner } = positionFundsClaim.body;

  const signer = extractUser(getQueueAuthenticated(tx));

  if (owner && !isEqualUser(owner, signer)) {
    throw new Error('Operation not permitted');
  }

  const issuer = constructContractIssuer(getContractId(tx));

  const firstTransactionFee = 300n;
  const secondTransactionFee = 1000n + queueCostFee();

  const closingPlannedDate = getTime() + CONSTANTS.CLOSE_POSITION_TIMEOUT;

  return [
    constructContinueTx(context, [
      constructTake(createActivePositionIndexKey(positionState.createdAt, positionId)),
      constructTake(
        createBestByQuoteActiveIndexKey(
          createBestByQuoteIndex(positionState.baseAmount, positionState.quoteAmount),
          positionId,
        ),
      ),
      constructStore(
        createPositionStateClaim({
          id: positionId,
          body: {
            ...positionState,
            expirationDate:
              closingPlannedDate < positionState.expirationDate ? closingPlannedDate : positionState.expirationDate,
            activityStatus: ACTIVITY_STATUS.CANCELLING,
          },
        }),
      ),
    ]),
    ...constructConditional(
      closingPlannedDate < positionState.expirationDate,
      constructContinueTx(
        context,
        [
          constructBlock([
            createExpirationPositionBlockFilter(closingPlannedDate),
            createClosedPositionBlockFilter(issuer, positionId),
          ]),
        ],
        [
          {
            callInfo: prepareQueueCall(issuer, {
              methodInfo: {
                methodName: PRIVATE_METHODS.CLOSE_POSITION,
                methodArgs: [
                  positionId,
                  {
                    baseAmount: positionState.baseAmount,
                    createdAt: positionState.createdAt,
                    quoteAmount: positionState.quoteAmount,
                    recipient: positionState.recipient,
                    chainData: positionState.chainData,
                    expirationDate: positionState.expirationDate,
                    txId: positionState.txId,
                    error: positionState.error,
                  },
                ] satisfies ClosePositionMethodArgs,
              },
              contractInfo: {
                providedCweb: availableCweb - firstTransactionFee - secondTransactionFee,
                authenticated: auth,
              },
              contractArgs: [constructRead(issuer, createPositionFundsKey(positionId))],
            }),
          },
        ],
      ),
    ),
  ];
};
