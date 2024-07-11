import {
  Context,
  constructContinueTx,
  constructContractIssuer,
  constructContractRef,
  constructRead,
  extractContractInfo,
  getContractId,
  getMethodArguments,
} from '@coinweb/contract-kit';

import { FEE, createPositionFundsKey, createPositionStateKey } from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';

export const cancelPositionPublic = (context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const [, positionId, providedCallFee] = getMethodArguments(context) as [unknown, string, string];

  const dueCallFee = FEE.CANCEL_POSITION;

  if (dueCallFee > BigInt(providedCallFee)) {
    throw new Error('Insufficient fee provided'); //TODO! Return a rest of cweb to signer;
  }

  const issuer = constructContractIssuer(getContractId(tx));

  const transactionFee = 1000n;

  return [
    constructContinueTx(
      context,
      [],
      [
        {
          callInfo: {
            ref: constructContractRef(issuer, []),
            methodInfo: {
              methodName: PRIVATE_METHODS.DEACTIVATE_POSITION,
              methodArgs: [positionId],
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: auth,
            },
            contractArgs: [
              constructRead(issuer, createPositionStateKey(positionId)),
              constructRead(issuer, createPositionFundsKey(positionId)),
            ],
          },
        },
      ],
    ),
  ];
};
