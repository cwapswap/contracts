import { AuthInfo, constructContinueTx, constructRangeRead, constructRead, Context } from '@coinweb/contract-kit';

import { createOrderStateFirstPart, createRequestStateKey, HexBigInt } from '../../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../../constants';
import { getContractIssuer, getContractRef } from '../../../../utils';
import { InitialRequestData, PrepareRequestPrivateArguments } from '../types';

export const constructPrepareRequest = ({
  context,
  id,
  initialRequestData,
  availableCweb,
  authInfo,
  quoteAmount,
}: {
  context: Context;
  id: string;
  initialRequestData: InitialRequestData;
  availableCweb: bigint;
  authInfo: AuthInfo;
  quoteAmount: HexBigInt;
}) => {
  const transactionFee = 2000n;

  const issuer = getContractIssuer(context);

  return [
    constructContinueTx(
      context,
      [],
      [
        {
          callInfo: {
            ref: getContractRef(context),
            methodInfo: {
              methodName: PRIVATE_METHODS.PREPARE_EXECUTION_REQUEST,
              methodArgs: [id, initialRequestData, quoteAmount] satisfies PrepareRequestPrivateArguments,
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: authInfo,
            },
            contractArgs: [
              constructRead(issuer, createRequestStateKey(id)),
              constructRangeRead(issuer, createOrderStateFirstPart(), {}, 1000),
            ],
          },
        },
      ],
    ),
  ];
};
