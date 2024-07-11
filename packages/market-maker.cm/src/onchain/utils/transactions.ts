import {
  DEFAULT_HANDLER_NAME,
  NewTxContinue,
  NewTxJump,
  PreparedOperation,
  constructContractRef,
  ecdsaContract,
  getContextSystem,
} from '@coinweb/contract-kit';

import { CONSTANTS } from '../constants';

import { getInstanceParameters } from './context';
import { createL1ExecuteEventBlockFilter } from './filters';

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

export const constructJumpCall = (eventNonce: bigint, requestId: string, providedCweb: bigint) => {
  const { shard: currentShard } = getContextSystem();
  const { shard: eventShard } = getInstanceParameters();

  if (currentShard === eventShard) {
    return [];
  }

  return [
    {
      callInfo: {
        ref: constructContractRef(
          {
            FromSmartContract: CONSTANTS.JUMP_CONTRACT_ID,
          },
          [],
        ),
        methodInfo: {
          methodName: DEFAULT_HANDLER_NAME,
          methodArgs: [eventShard, [createL1ExecuteEventBlockFilter(requestId, eventNonce)]],
        },
        contractInfo: {
          providedCweb,
          authenticated: null,
        },
        contractArgs: [],
      },
    },
  ];
};
