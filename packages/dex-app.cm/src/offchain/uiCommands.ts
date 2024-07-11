import {
  ContractCall,
  constructContractIssuer,
  constructSingleReadClaim,
  constructSelfRegisterKey,
} from '@coinweb/contract-kit';

import { FEE, PUBLIC_METHODS } from './shared';
import { toHex } from './shared/utils';
import { CancelPositionRequestData, CreatePositionRequestData } from './types';

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

export const creteNewPositionUiCommand = ({
  contractId,
  baseAmount,
  quoteAmount,
  recipient,
  contractOwnerFee,
}: CreatePositionRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.CREATE_POSITION,
    [baseAmount, quoteAmount, recipient, contractOwnerFee, toHex(FEE.CREATE_POSITION)],
    BigInt(baseAmount) + BigInt(contractOwnerFee) + FEE.CREATE_POSITION,
  );
};

export const cancelPositionUiCommand = ({ contractId, positionId }: CancelPositionRequestData) => {
  return createCallContractCommand(
    contractId,
    PUBLIC_METHODS.CANCEL_POSITION,
    [positionId, toHex(FEE.CANCEL_POSITION)],
    FEE.CANCEL_POSITION,
  );
};
