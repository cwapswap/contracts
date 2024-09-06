import {
  constructContinueTx,
  constructStore,
  constructTake,
  Context,
  passCwebFrom,
  selfCallWrapper,
} from '@coinweb/contract-kit';

import {
  createMakerDepositKey,
  CreateOrderArguments,
  FEE,
  MakerDepositClaimBody,
  toHex,
} from '../../../offchain/shared';
import { PRIVATE_METHODS } from '../../constants';
import { ContractOwnerClaimBody, TypedClaim } from '../../types';
import {
  constructConditional,
  createMakerDepositClaim,
  getCallParameters,
  getContractIssuer,
  getContractRef,
  getInstanceParameters,
  getMethodArguments,
  getReadClaimByIndex,
  getUser,
} from '../../utils';
import { isEqualUser } from '../../utils/user';

import { PrepareSeedPrivateArguments, SeedOrdersPrivateArguments } from './types';

const getRandomInRange = (min: bigint, max: bigint): bigint => {
  const range = max - min + 1n;
  const randomOffset = BigInt(Math.floor(Math.random() * Number(range)));

  return min + randomOffset;
};

export const prepareSeed = selfCallWrapper((context: Context) => {
  const { availableCweb, authInfo } = getCallParameters(context);

  const [minBaseHex, maxBaseHex, minQuoteHex, maxQuoteHex] = getMethodArguments<PrepareSeedPrivateArguments>(context);

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
  let fundsToDeposit = 0n;

  if (seedFunds <= 0n) {
    throw new Error('Not enough funds provided for seed');
  }

  const seedTransactionFee = 1000n;

  const minBase = BigInt(minBaseHex);
  const maxBase = BigInt(maxBaseHex);
  const minQuote = BigInt(minQuoteHex);
  const maxQuote = BigInt(maxQuoteHex);

  while (seedFunds > seedTransactionFee + FEE.CREATE_ORDER + minBase) {
    seedFunds -= seedTransactionFee + FEE.CREATE_ORDER;

    const suggestedAmount = getRandomInRange(minBase, maxBase);
    const baseAmount = seedFunds > suggestedAmount ? suggestedAmount : seedFunds;

    seedFunds -= baseAmount;

    fundsToDeposit += baseAmount;

    const l1Amount = getRandomInRange(minQuote, maxQuote);

    orders.push([toHex(baseAmount), toHex(l1Amount), getUser(context).payload as string]);
  }

  const totalDeposit = storedDeposit + fundsToDeposit + seedFunds;

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(issuer, availableCweb),
        ...constructConditional(!!depositClaim, constructTake(createMakerDepositKey(caller))),
        constructStore(
          createMakerDepositClaim({
            user: caller,
            amount: totalDeposit,
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
              providedCweb: availableCweb - transactionFee - totalDeposit,
              authenticated: authInfo,
            },
            contractArgs: [],
          },
        },
      ],
    ),
  ];
});
