import {
  AuthInfo,
  constructBlock,
  constructContinueTx,
  constructRead,
  Context,
  ContractIssuer,
  User,
} from '@coinweb/contract-kit';

import {
  createOrderStateKey,
  createMakerDepositKey,
  createRequestStateKey,
  toHex,
  createRequestFundsKey,
} from '../../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../../constants';
import {
  createExpirationBlockFilter,
  createExpirationClaimKey,
  createL1ExecuteEventBlockFilter,
  createL1ExecuteEventClaimKey,
  getContractRef,
  wrapWithJumpEventBlockFilter,
  wrapWithJumpEventClaimKey,
} from '../../../../utils';
import { HandleExecutionBlockTriggeredArguments } from '../../handleExecutionBlockTriggered/types';

export const constructCallWithL1Block = ({
  requestId,
  orderId,
  context,
  nonce,
  providedCweb,
  authInfo,
  issuer,
  expirationDate,
  owner,
}: {
  requestId: string;
  orderId: string;
  context: Context;
  nonce: bigint;
  providedCweb: bigint;
  authInfo: AuthInfo;
  issuer: ContractIssuer;
  expirationDate: number;
  owner: User;
}) => {
  const transactionFee = 1200n;

  return constructContinueTx(
    context,
    [],
    [
      {
        callInfo: {
          ref: getContractRef(context),
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
              'L2BlockInfoProvider',
              wrapWithJumpEventClaimKey(createL1ExecuteEventClaimKey(requestId, nonce), issuer),
            ),
            constructRead('L2BlockInfoProvider', createExpirationClaimKey(expirationDate)),
            constructRead(issuer, createRequestStateKey(requestId)),
            constructRead(issuer, createOrderStateKey(orderId)),
            constructRead(issuer, createMakerDepositKey(owner)),
            constructRead(issuer, createRequestFundsKey(requestId)),
            constructBlock([
              createExpirationBlockFilter(expirationDate),
              wrapWithJumpEventBlockFilter(createL1ExecuteEventBlockFilter(requestId, 0n), issuer),
            ]),
          ],
        },
      },
    ],
  );
};
