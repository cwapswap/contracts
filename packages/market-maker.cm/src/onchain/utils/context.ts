import {
  Context,
  getMethodArguments as cKitGetMethodArguments,
  extractContractArgs,
  getParameters,
  extractContractInfo,
  constructContractIssuer,
  getContractId,
  constructContractRef,
  extractUser,
  ResolvedOperation,
  Claim,
  extractRead,
  OrdJson,
  getContextSystem,
  getQueueAuthenticated,
} from '@coinweb/contract-kit';

import { InstanceParameters, TypedClaim } from '../types';

export const getMethodArguments = <TArguments extends unknown[]>(context: Context) =>
  cKitGetMethodArguments(context).slice(1) as TArguments;

export const getContractArguments = <TArguments extends unknown[]>(context: Context) =>
  extractContractArgs(context.tx) as TArguments;

export const getInstanceParameters = () => getParameters('contract/parameters.json') as InstanceParameters;

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

export const getContractIssuer = (context: Context) => constructContractIssuer(getContractId(context.tx));

export const getContractRef = (context: Context) => constructContractRef(getContractIssuer(context), []);

export const getUser = (context: Context) => extractUser(getQueueAuthenticated(context.tx));

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

export const getTime = () => {
  const { nanos_since_epoch: nanos, secs_since_epoch: secs } = getContextSystem().block_time;
  const time = secs * 1000 + nanos / 1_000_000;

  return time;
};
