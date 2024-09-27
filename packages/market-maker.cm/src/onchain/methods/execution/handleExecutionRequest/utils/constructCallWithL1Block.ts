import {
  AuthInfo,
  constructBlock,
  constructContinueTx,
  constructRead,
  Context,
  ContractIssuer,
  prepareQueueCall,
  queueCostFee,
  User,
} from '@coinweb/contract-kit';

import {
  createOrderStateKey,
  createMakerDepositKey,
  createRequestStateKey,
  toHex,
  createRequestFundsKey,
} from '../../../../../offchain/shared';
import { CONSTANTS, PRIVATE_METHODS } from '../../../../constants';
import {
  createExpirationBlockFilter,
  createExpirationClaimKey,
  createL1ExecuteEventBlockFilter,
  createL1ExecuteEventClaimKey,
  getContractIssuer,
  wrapWithJumpEventBlockFilter,
  wrapWithJumpEventClaimKey,
  wrapWithJumpEventIssuer,
} from '../../../../utils';
import { HandleExecutionBlockTriggeredArguments } from '../../handleExecutionBlockTriggered/types';

export const constructCallWithL1Block = ({
  context,
  requestId,
  orderId,
  nonce,
  providedCweb,
  authInfo,
  issuer,
  expirationDate,
  owner,
}: {
  context: Context;
  requestId: string;
  orderId: string;
  nonce: bigint;
  providedCweb: bigint;
  authInfo: AuthInfo;
  issuer: ContractIssuer;
  expirationDate: number;
  owner: User;
}) => {
  const transactionFee = 1200n + queueCostFee();

  return constructContinueTx(
    context,
    [
      constructBlock([
        createExpirationBlockFilter(expirationDate),
        wrapWithJumpEventBlockFilter(createL1ExecuteEventBlockFilter(requestId, 0n), issuer),
      ]),
    ],
    [
      {
        callInfo: prepareQueueCall(getContractIssuer(context), {
          methodInfo: {
            methodName: PRIVATE_METHODS.HANDLE_EXECUTION_BLOCK_TRIGGERED,
            methodArgs: [requestId, orderId, toHex(nonce)] satisfies HandleExecutionBlockTriggeredArguments,
          },
          contractInfo: {
            providedCweb: providedCweb - transactionFee,
            authenticated: authInfo,
          },
          contractArgs: [
            constructRead(
              wrapWithJumpEventIssuer(),
              wrapWithJumpEventClaimKey(createL1ExecuteEventClaimKey(requestId, nonce), issuer),
            ),
            constructRead(CONSTANTS.BLOCK_HEIGHT_INFO_PROVIDER, createExpirationClaimKey(expirationDate)),
            constructRead(issuer, createRequestStateKey(requestId)),
            constructRead(issuer, createOrderStateKey(orderId)),
            constructRead(issuer, createMakerDepositKey(owner)),
            constructRead(issuer, createRequestFundsKey(requestId)),
          ],
        }),
      },
    ],
  );
};
