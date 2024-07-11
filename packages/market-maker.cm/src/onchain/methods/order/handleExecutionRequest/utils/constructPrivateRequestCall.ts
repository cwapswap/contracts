import {
  AuthInfo,
  Context,
  ContractIssuer,
  constructContinueTx,
  constructContractRef,
  constructRead,
  passCwebFrom,
} from '@coinweb/contract-kit';

import { createOrderCollateralKey, createOrderStateKey } from '../../../../../offchain/shared';
import { createRequestStateKey } from '../../../../../offchain/shared/keys/request';
import { PRIVATE_METHODS } from '../../../../constants';
import { CreateRequestPrivateArguments, PreparedRequest } from '../types';

export const constructPrivateRequestCall = (
  context: Context,
  issuer: ContractIssuer,
  requestId: string,
  preparedRequest: PreparedRequest,
  providedCweb: bigint,
  authenticated: AuthInfo,
) => {
  const transactionFee = 900n;

  return constructContinueTx(
    context,
    [passCwebFrom(issuer, providedCweb)],
    [
      {
        callInfo: {
          ref: constructContractRef(issuer, []),
          methodInfo: {
            methodName: PRIVATE_METHODS.CREATE_EXECUTION_REQUEST,
            methodArgs: [requestId, preparedRequest] satisfies CreateRequestPrivateArguments,
          },
          contractInfo: {
            providedCweb: providedCweb - transactionFee,
            authenticated,
          },
          contractArgs: [
            constructRead(issuer, createRequestStateKey(requestId)),
            constructRead(issuer, createOrderStateKey(preparedRequest.requestedOrderId)),
            constructRead(issuer, createOrderCollateralKey(preparedRequest.requestedOrderId)),
          ],
        },
      },
    ],
  );
};
