import { NewTxContinue, NewTxJump, PreparedOperation, ecdsaContract } from '@coinweb/contract-kit';

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
