import {
  Context,
  constructBlock,
  constructContinueTx,
  constructRead,
  constructStore,
  constructTake,
  passCwebFrom,
  selfCallWrapper,
} from '@coinweb/contract-kit';

import {
  ORDER_ACTIVITY_STATUS,
  OrderStateClaimBody,
  MakerDepositClaimBody,
  createOrderStateKey,
  createMakerDepositKey,
} from '../../../../offchain/shared';
import { CONSTANTS, PRIVATE_METHODS } from '../../../constants';
import { TypedClaim } from '../../../types';
import {
  createBestOrderIndexClaim,
  createClosedOrderBlockFilter,
  createExpirationBlockFilter,
  createOrderActiveIndexClaim,
  createOrderCollateralClaim,
  createOrderDateIndexClaim,
  createOrderOwnerIndexClaim,
  createOrderStateClaim,
  createMakerDepositClaim,
  getCallParameters,
  getContractIssuer,
  getContractRef,
  getInstanceParameters,
  getMethodArguments,
  getReadClaimByIndex,
  getUser,
  hashObject,
} from '../../../utils';
import { DeactivateOrderPrivateArguments } from '../cancelOrder/types';

import { CreateOrderPrivateArguments } from './types';
import { constructPrivateOrderCall } from './utils';

export const createOrder = selfCallWrapper((context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [id, initialState] = getMethodArguments<CreateOrderPrivateArguments>(context);

  const issuer = getContractIssuer(context);

  const existingOrder = getReadClaimByIndex<TypedClaim<OrderStateClaimBody>>(context)(0);

  if (existingOrder) {
    const orderNewId = hashObject(initialState, id);

    return [constructPrivateOrderCall(context, issuer, orderNewId, initialState, availableCweb, authInfo)];
  }

  const depositClaim = getReadClaimByIndex<TypedClaim<MakerDepositClaimBody>>(context)(1);

  if (!depositClaim || !BigInt(depositClaim.fees_stored)) {
    throw new Error('Not enough deposit');
  }

  const depositOwner = depositClaim?.body.owner;
  const depositAmount = BigInt(depositClaim.fees_stored);

  const baseAmount = BigInt(initialState.baseAmount);
  const quoteAmount = BigInt(initialState.quoteAmount);

  const collateralPercentage = getInstanceParameters().collateral_percentage_Int;
  const collateral = (baseAmount * BigInt(collateralPercentage)) / 100n;

  if (depositAmount < collateral) {
    throw new Error('Not enough deposit');
  }

  const firstTransactionFee = 1200n + baseAmount;
  const secondTransactionFee = 1000n;

  const user = getUser(context);

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, firstTransactionFee),
      constructTake(createMakerDepositKey(depositOwner)),
      constructStore(
        createMakerDepositClaim({
          amount: depositAmount - collateral,
          user: depositOwner,
        }),
      ),
      constructStore(
        createOrderStateClaim({
          id,
          body: initialState,
        }),
      ),
      constructStore(
        createOrderCollateralClaim({
          id,
          owner: user,
          amount: collateral,
        }),
      ),
      constructStore(
        createOrderActiveIndexClaim({
          id,
          timestamp: initialState.createdAt,
        }),
      ),
      constructStore(
        createOrderDateIndexClaim({
          id,
          timestamp: initialState.createdAt,
        }),
      ),
      constructStore(
        createBestOrderIndexClaim({
          id,
          baseAmount,
          quoteAmount,
        }),
      ),
      constructStore(
        createOrderOwnerIndexClaim({
          id,
          user,
          timestamp: initialState.createdAt,
        }),
      ),
    ]),
    constructContinueTx(
      context,
      [],
      [
        {
          callInfo: {
            ref: getContractRef(context),
            methodInfo: {
              methodName: PRIVATE_METHODS.DEACTIVATE_ORDER,
              methodArgs: [id, ORDER_ACTIVITY_STATUS.EXPIRED] satisfies DeactivateOrderPrivateArguments,
            },
            contractInfo: {
              providedCweb: availableCweb - firstTransactionFee - secondTransactionFee,
              authenticated: authInfo,
            },
            contractArgs: [
              constructRead(issuer, createOrderStateKey(id)),
              constructBlock([
                createExpirationBlockFilter(
                  initialState.createdAt + CONSTANTS.ORDER_LIFE_TIME - CONSTANTS.CLOSE_ORDER_TIMEOUT,
                ),
                createClosedOrderBlockFilter(issuer, id),
              ]),
            ],
          },
        },
      ],
    ),
  ];
});
