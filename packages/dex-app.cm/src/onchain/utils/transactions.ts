import {
  AuthInfo,
  ClaimKey,
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
import { CONSTANTS, PRIVATE_METHODS } from '../constants';

import { createExpirationPositionClaimKey } from './claims';
import {
  createClosedPositionBlockFilter,
  createExpirationPositionBlockFilter,
  createL1AcceptEventBlockFilter,
} from './filters';
import { wrapWithJumpEventBlockFilter, wrapWithJumpEventClaimKey, wrapWithJumpEventIssuer } from './jumps';

export const createCreatePositionCallPrivate = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  methodArgs: [
    positionNewId: string,
    positionState: PositionStateClaimBody,
    signer: string | undefined,
    ownerFee: string,
  ],
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

export const createCallWithL1EventBlock = ({
  authenticated,
  eventClaimKey,
  eventNonce,
  issuer,
  methodName,
  positionId,
  positionState,
  providedCweb,
  withExpiration,
}: {
  methodName: string;
  issuer: ContractIssuer;
  providedCweb: bigint;
  authenticated: AuthInfo;
  eventClaimKey: ClaimKey;
  eventNonce: bigint | null;
  positionId: string;
  positionState: PositionStateClaimBody;
  withExpiration: boolean;
}) => {
  return [
    {
      callInfo: {
        ref: constructContractRef(issuer, []),
        methodInfo: {
          methodName,
          methodArgs: [positionId, eventNonce === null ? eventNonce : toHex(eventNonce), positionState],
        },
        contractInfo: {
          providedCweb,
          authenticated,
        },
        contractArgs: [
          constructRead(wrapWithJumpEventIssuer(), wrapWithJumpEventClaimKey(eventClaimKey, issuer)),
          constructRead(issuer, createPositionFundsKey(positionId)),
          constructRead(issuer, createPositionStateKey(positionId)),
          constructRead(
            CONSTANTS.BLOCK_HEIGHT_INFO_PROVIDER,
            createExpirationPositionClaimKey(positionState.expirationDate),
          ),
          constructRead(issuer, createClosedIndexKey(positionId)),
          constructBlock([
            wrapWithJumpEventBlockFilter(createL1AcceptEventBlockFilter(eventClaimKey), issuer),
            createClosedPositionBlockFilter(issuer, positionId),
            ...(withExpiration ? [createExpirationPositionBlockFilter(positionState.expirationDate)] : []),
          ]),
        ],
      },
    },
  ] satisfies [FullCallInfo];
};

export const { constructSendCweb } = ecdsaContract();

type ConditionalInput = PreparedOperation[] | PreparedOperation | NewTxContinue | NewTxJump;

type ConditionalAltInput<TInput extends ConditionalInput> = TInput extends NewTxContinue
  ? NewTxContinue | NewTxJump
  : TInput extends NewTxJump
    ? NewTxContinue | NewTxJump
    : PreparedOperation[] | PreparedOperation;

type ConditionalOutput<TInput extends ConditionalInput> = TInput extends NewTxContinue
  ? NewTxContinue[]
  : TInput extends NewTxJump
    ? NewTxJump[]
    : PreparedOperation[];

type ConstructConditional = <TInput extends ConditionalInput, TAltInput extends ConditionalAltInput<TInput>>(
  condition: boolean,
  ops: TInput,
  altOps?: TAltInput,
) => ConditionalOutput<TInput> | ConditionalOutput<TAltInput>;

export const constructConditional = ((condition, ops, altOps = [] as unknown) => {
  if (!condition) {
    if (Array.isArray(altOps)) {
      return altOps;
    }

    return [altOps];
  }

  if (Array.isArray(ops)) {
    return ops;
  }

  return [ops];
}) as ConstructConditional;
