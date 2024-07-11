import {
  AuthInfo,
  Context,
  ContractIssuer,
  constructContinueTx,
  constructContractRef,
  constructRead,
  passCwebFrom,
} from '@coinweb/contract-kit';

import { OrderStateClaimBody, createOrderStateKey, createMakerDepositKey } from '../../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../../constants';
import { getUser } from '../../../../utils';
import { CreateOrderPrivateArguments } from '../types';

export const constructPrivateOrderCall = (
  context: Context,
  issuer: ContractIssuer,
  orderId: string,
  orderInitialState: OrderStateClaimBody,
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
            methodName: PRIVATE_METHODS.CREATE_ORDER,
            methodArgs: [orderId, orderInitialState] satisfies CreateOrderPrivateArguments,
          },
          contractInfo: {
            providedCweb: providedCweb - transactionFee,
            authenticated,
          },
          contractArgs: [
            constructRead(issuer, createOrderStateKey(orderId)),
            constructRead(issuer, createMakerDepositKey(getUser(context))),
          ],
        },
      },
    ],
  );
};
