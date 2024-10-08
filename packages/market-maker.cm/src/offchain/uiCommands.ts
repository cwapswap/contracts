import { ContractCall, constructContractIssuer, prepareQueueContractCall } from '@coinweb/contract-kit';

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
  const issuer = constructContractIssuer(contractId);
  const contractCall: ContractCall = prepareQueueContractCall(issuer, { methodName, methodArgs }, cost, auth);

  return JSON.stringify({ CustomV1: { calls: [contractCall] } });
};

export const makeDepositUiCommand = ({ contractId, depositAmount }: DepositRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.DEPOSIT,
    [toHex(depositAmount)] satisfies DepositArguments,
    depositAmount + FEE.DEPOSIT,
  );
};

export const makeWithdrawUiCommand = ({ contractId, withdrawAmount }: WithdrawRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.WITHDRAW,
    [toHex(withdrawAmount)] satisfies WithdrawArguments,
    FEE.WITHDRAW,
  );
};

export const createOrderUiCommand = ({ contractId, baseRecipient, l1Amount, baseAmount }: CreateOrderRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.CREATE_ORDER,
    [toHex(baseAmount), toHex(l1Amount), baseRecipient] satisfies CreateOrderArguments,
    FEE.CREATE_ORDER,
  );
};

export const deleteOrderUiCommand = ({ contractId, orderId }: CancelOrderRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.CANCEL_ORDER,
    [orderId] satisfies CancelOrderArguments,
    FEE.CANCEL_ORDER,
  );
};
