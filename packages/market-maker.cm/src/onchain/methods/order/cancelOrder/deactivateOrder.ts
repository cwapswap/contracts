import {
  Context,
  constructBlock,
  constructContinueTx,
  constructRead,
  constructStore,
  constructTake,
  selfCallWrapper,
} from '@coinweb/contract-kit';

import {
  ORDER_ACTIVITY_STATUS,
  OrderStateClaimBody,
  createActiveOrderIndexKey,
  createOrderCollateralKey,
  createMakerDepositKey,
  createOrderStateKey,
} from '../../../../offchain/shared';
import { CONSTANTS, PRIVATE_METHODS } from '../../../constants';
import { TypedClaim } from '../../../types';
import {
  constructConditional,
  createClosedOrderBlockFilter,
  createExpirationBlockFilter,
  createOrderStateClaim,
  getCallParameters,
  getContractIssuer,
  getContractRef,
  getMethodArguments,
  getReadClaimByIndex,
  getUser,
} from '../../../utils';
import { isEqualUser } from '../../../utils/user';

import { CloseOrderPrivateArguments, DeactivateOrderPrivateArguments } from './types';

export const deactivateOrder = selfCallWrapper((context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [id, statusReason] = getMethodArguments<DeactivateOrderPrivateArguments>(context);

  const stateClaim = getReadClaimByIndex<TypedClaim<OrderStateClaimBody>>(context)(0);

  if (!stateClaim) {
    throw new Error('Order does not exist');
  }

  const state = stateClaim.body;

  const signer = getUser(context);

  if (!isEqualUser(state.owner, signer)) {
    throw new Error('Operation not permitted');
  }

  const issuer = getContractIssuer(context);

  const firstTransactionFee = 300n;
  const secondTransactionFee = 1000n;

  const closingPlannedDate = Date.now() + CONSTANTS.CLOSE_ORDER_TIMEOUT;

  if (stateClaim.body.activityStatus !== ORDER_ACTIVITY_STATUS.ACTIVE) {
    throw new Error("Order can't be closed");
  }

  return [
    constructContinueTx(context, [
      constructTake(createActiveOrderIndexKey(state.createdAt, id)),
      constructStore(
        createOrderStateClaim({
          id,
          body: {
            ...state,
            expirationDate: closingPlannedDate < state.expirationDate ? closingPlannedDate : state.expirationDate,
            activityStatus: ORDER_ACTIVITY_STATUS.CANCELLING,
          },
        }),
      ),
    ]),
    ...constructConditional(
      closingPlannedDate < state.expirationDate,
      constructContinueTx(
        context,
        [],
        [
          {
            callInfo: {
              ref: getContractRef(context),
              methodInfo: {
                methodName: PRIVATE_METHODS.CLOSE_ORDER,
                methodArgs: [id, statusReason] satisfies CloseOrderPrivateArguments,
              },
              contractInfo: {
                providedCweb: availableCweb - firstTransactionFee - secondTransactionFee,
                authenticated: authInfo,
              },
              contractArgs: [
                constructRead(issuer, createOrderStateKey(id)),
                constructRead(issuer, createOrderCollateralKey(id)),
                constructRead(issuer, createMakerDepositKey(state.owner)),
                constructBlock([
                  createExpirationBlockFilter(closingPlannedDate),
                  createClosedOrderBlockFilter(issuer, id),
                ]),
              ],
            },
          },
        ],
      ),
    ),
  ];
});
