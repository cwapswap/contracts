import {
  constructContinueTx,
  constructStore,
  constructTake,
  Context,
  passCwebFrom,
  selfCallWrapper,
} from '@coinweb/contract-kit';

import { createMakerDepositKey, CreateOrderArguments, MakerDepositClaimBody, toHex } from '../../../offchain/shared';
import { PRIVATE_METHODS } from '../../constants';
import { ContractOwnerClaimBody, TypedClaim } from '../../types';
import {
  constructConditional,
  createMakerDepositClaim,
  getCallParameters,
  getContractIssuer,
  getContractRef,
  getInstanceParameters,
  getReadClaimByIndex,
  getUser,
} from '../../utils';
import { isEqualUser } from '../../utils/user';

import { SeedOrdersPrivateArguments } from './types';

export const prepareSeed = selfCallWrapper((context: Context) => {
  const { availableCweb, authInfo } = getCallParameters(context);

  const contractOwnerClaim = getReadClaimByIndex<TypedClaim<ContractOwnerClaimBody>>(context)(0);

  const contractOwner = contractOwnerClaim?.body.owner ?? getInstanceParameters().owner;

  const caller = getUser(context);

  if (!isEqualUser(caller, contractOwner)) {
    throw new Error('Operation is not permitted');
  }

  const depositClaim = getReadClaimByIndex<TypedClaim<MakerDepositClaimBody>>(context)(0);
  const storedDeposit = BigInt(depositClaim?.fees_stored ?? 0);

  const issuer = getContractIssuer(context);

  const transactionFee = 1000n;

  const orders: CreateOrderArguments[] = [];

  let seedFunds = availableCweb - transactionFee;

  if (seedFunds <= 0n) {
    throw new Error('Not enough funds provided for seed');
  }

  const seedTransactionFee = 50000n;
  const seedCallFee = 1000n;

  while (seedFunds > seedTransactionFee + seedCallFee + 100n) {
    seedFunds -= seedTransactionFee + seedCallFee;

    const suggestedAmount = BigInt(Math.random() * 200 + 100);
    const baseAmount = seedFunds > suggestedAmount ? suggestedAmount : seedFunds;

    seedFunds -= baseAmount;

    const rate = BigInt(Math.random() * 5 + 5);
    const l1Amount = (baseAmount * rate) / 100n;

    orders.push([toHex(baseAmount), toHex(l1Amount), getUser(context).payload as string]);
  }

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(issuer, availableCweb),
        ...constructConditional(!!depositClaim, constructTake(createMakerDepositKey(caller))),
        constructStore(
          createMakerDepositClaim({
            user: caller,
            amount: storedDeposit + seedFunds,
          }),
        ),
      ],
      [
        {
          callInfo: {
            ref: getContractRef(context),
            methodInfo: {
              methodName: PRIVATE_METHODS.SEED_ORDERS,
              methodArgs: orders satisfies SeedOrdersPrivateArguments,
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: authInfo,
            },
            contractArgs: [],
          },
        },
      ],
    ),
  ];
});
