import {
  Context,
  getMethodArguments as cKitGetMethodArguments,
  extractContractArgs,
  getParameters as cKitGetParameters,
  extractContractInfo,
  constructContractIssuer,
  getContractId,
  constructContractRef,
  extractUser,
  getAuthenticated,
  ResolvedOperation,
  Claim,
  extractRead,
  OrdJson,
} from '@coinweb/contract-kit';

import { InstanceParameters, TypedClaim } from '../types';

export const getMethodArguments = <TArguments extends unknown[]>(context: Context) =>
  cKitGetMethodArguments(context).slice(1) as TArguments;

export const getContractArguments = <TArguments extends unknown[]>(context: Context) =>
  extractContractArgs(context.tx) as TArguments;

export const getInstanceParameters = () => cKitGetParameters('contract/parameters.json') as InstanceParameters;

export const getCallParameters = (context: Context) => {
  const { authenticated, providedCweb } = extractContractInfo(context.tx);

  if (!providedCweb) {
    throw new Error('Cweb was not provided');
  }

  return {
    availableCweb: providedCweb,
    authInfo: authenticated,
  };
};

export const getContractOwnerFee = (amount: bigint) => {
  const { owner_min_fee_Hex, owner_percentage_fee_Int } = getInstanceParameters();

  const ownerMinFee = BigInt(owner_min_fee_Hex || 0);
  const ownerPercentageFee = BigInt(owner_percentage_fee_Int || 0);

  let baseAmount = (amount * 100n) / (100n + ownerPercentageFee);

  const calculatedOwnerPercentageFee = (amount * ownerPercentageFee) / 100n;

  let ownerFee = calculatedOwnerPercentageFee;

  if (calculatedOwnerPercentageFee < ownerMinFee) {
    ownerFee = ownerMinFee;
    baseAmount = amount - ownerFee;
  }

  return baseAmount;
};

export const getContractIssuer = (context: Context) => constructContractIssuer(getContractId(context.tx));

export const getContractRef = (context: Context) => constructContractRef(getContractIssuer(context), []);

export const getUser = (context: Context) => extractUser(getAuthenticated(context.tx));

let contractArguments: ResolvedOperation[] | null = null;

export const getReadClaimByIndex =
  <TClaim extends Claim = TypedClaim<OrdJson>>(context: Context) =>
  (index: number) => {
    if (!contractArguments) {
      contractArguments = extractContractArgs(context.tx);
    }

    if (!contractArguments[index]) {
      return null;
    }

    return (extractRead(contractArguments[index])?.[0]?.content as TClaim) || null;
  };
