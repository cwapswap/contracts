import {
  ContractCall,
  constructContractIssuer,
  constructSingleReadClaim,
  constructSelfRegisterKey,
} from '@coinweb/contract-kit';

import {
  CancelOrderArguments,
  CreateOrderArguments,
  DepositArguments,
  FEE,
  PUBLIC_METHODS,
  WithdrawArguments,
} from './shared';
import { toHex } from './shared/utils';
import { DepositRequestData, WithdrawRequestData, CreateOrderRequestData, CancelOrderRequestData } from './types';

const createCallContractCommand = (
  contractId: string,
  methodName: string,
  methodArgs: unknown[],
  cost: bigint,
  auth: boolean = true,
) => {
  const contractCall: ContractCall = {
    contract_input: {
      data: [methodName, ...methodArgs],
      cost: toHex(cost),
      authenticated: auth,
    },
    contract_ref: {
      explicit: [],
      stored: [constructSingleReadClaim(constructContractIssuer(contractId), constructSelfRegisterKey())],
    },
  };

  return JSON.stringify({ CustomV1: { calls: [contractCall] } });
};

export const deposit = ({ contractId, depositAmount, contractOwnerFee }: DepositRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.CREATE_ORDER,
    [toHex(depositAmount)] satisfies DepositArguments,
    depositAmount + FEE.DEPOSIT + contractOwnerFee,
  );
};

export const withdraw = ({ contractId, withdrawAmount }: WithdrawRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.CREATE_ORDER,
    [toHex(withdrawAmount)] satisfies WithdrawArguments,
    FEE.WITHDRAW,
  );
};

export const createOrder = ({ contractId, baseWallet, l1Amount, baseAmount }: CreateOrderRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.CREATE_ORDER,
    [toHex(baseAmount), toHex(l1Amount), baseWallet] satisfies CreateOrderArguments,
    baseAmount + FEE.CREATE_ORDER,
  );
};

export const deleteOrder = ({ contractId, orderId }: CancelOrderRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.CANCEL_ORDER,
    [orderId] satisfies CancelOrderArguments,
    FEE.CANCEL_ORDER,
  );
};
