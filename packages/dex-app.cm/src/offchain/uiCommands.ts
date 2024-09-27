import { ContractCall, constructContractIssuer, prepareQueueContractCall } from '@coinweb/contract-kit';

import { FEE, PUBLIC_METHODS } from './shared';
import {
  CancelPositionRequestData,
  CreatePositionBtcRequestData,
  CreatePositionEvmRequestData,
  CreatePositionRequestData,
} from './types';

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

export const creteNewPositionUiCommand = ({
  contractId,
  quoteAmount,
  recipient,
  contractOwnerFee,
  baseAmount,
  chainData,
}: CreatePositionRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.CREATE_POSITION,
    [quoteAmount, recipient, chainData],
    BigInt(baseAmount) + BigInt(contractOwnerFee) + FEE.CREATE_POSITION,
  );
};

export const creteNewPositionBtcUiCommand = (data: CreatePositionBtcRequestData) => {
  return creteNewPositionUiCommand(data);
};

export const creteNewPositionEvmUiCommand = (data: CreatePositionEvmRequestData) => {
  return creteNewPositionUiCommand(data);
};

export const cancelPositionUiCommand = ({ contractId, positionId }: CancelPositionRequestData) => {
  return createCallContractCommand(contractId, PUBLIC_METHODS.CANCEL_POSITION, [positionId], FEE.CANCEL_POSITION);
};
