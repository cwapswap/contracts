import {
  AuthInfo,
  Context,
  ContractIssuer,
  FullCallInfo,
  NewTxContinue,
  NewTxJump,
  PreparedOperation,
  constructBlock,
  constructContinueTx,
  constructContractRef,
  constructRead,
  ecdsaContract,
  passCwebFrom,
} from '@coinweb/contract-kit';

import {
  PositionStateClaimBody,
  createClosedIndexKey,
  createOwnerKey,
  createPositionFundsKey,
  createPositionStateKey,
  toHex,
} from '../../offchain/shared';
import { PRIVATE_METHODS } from '../constants';

import { createExpirationPositionClaimKey, createL1AcceptEventClaimKey } from './claims';
import {
  createClosedPositionBlockFilter,
  createExpirationPositionBlockFilter,
  createL1AcceptEventBlockFilter,
} from './filters';

export const createCheckPositionCall = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  methodArgs: [positionNewId: string, positionState: PositionStateClaimBody, signer: string, ownerFee: string],
  providedCweb: bigint,
  authenticated: AuthInfo,
) => {
  const transactionFee = 1000n;

  return [
    constructContinueTx(
      context,
      [passCwebFrom(issuer, providedCweb)],
      [
        {
          callInfo: {
            ref: constructContractRef(issuer, []),
            methodInfo: {
              methodName: PRIVATE_METHODS.CREATE_POSITION,
              methodArgs,
            },
            contractInfo: {
              providedCweb: providedCweb - transactionFee,
              authenticated,
            },
            contractArgs: [
              constructRead(issuer, createPositionStateKey(positionId)),
              constructRead(issuer, createOwnerKey()),
            ],
          },
        },
      ],
    ),
  ];
};

export const createCallWithL1EventBlock = (
  methodName: string,
  issuer: ContractIssuer,
  providedCweb: bigint,
  authenticated: AuthInfo,
  eventNonce: bigint,
  positionId: string,
  positionState: PositionStateClaimBody,
) =>
  [
    {
      callInfo: {
        ref: constructContractRef(issuer, []),
        methodInfo: {
          methodName,
          methodArgs: [positionId, toHex(eventNonce), positionState],
        },
        contractInfo: {
          providedCweb,
          authenticated,
        },
        contractArgs: [
          constructRead('L2BlockInfoProvider', createL1AcceptEventClaimKey(positionId, eventNonce)),
          constructRead(issuer, createPositionFundsKey(positionId)),
          constructRead('L2BlockInfoProvider', createExpirationPositionClaimKey(positionState.expirationDate)),
          constructRead(issuer, createClosedIndexKey(positionId)),
          constructBlock([
            createL1AcceptEventBlockFilter(positionId, eventNonce),
            createExpirationPositionBlockFilter(positionState.expirationDate),
            createClosedPositionBlockFilter(issuer, positionId),
          ]),
        ],
      },
    },
  ] satisfies [FullCallInfo];

export const { constructSendCweb } = ecdsaContract();

export const constructConditional = <T extends PreparedOperation[] | PreparedOperation | NewTxContinue | NewTxJump>(
  condition: boolean,
  ops: T,
): T extends PreparedOperation[] ? T : T[] => {
  type Result = T extends PreparedOperation[] ? T : T[];

  if (!condition) {
    return [] as unknown as Result;
  }

  if (Array.isArray(ops)) {
    return ops as unknown as Result;
  }

  return [ops] as unknown as Result;
};
