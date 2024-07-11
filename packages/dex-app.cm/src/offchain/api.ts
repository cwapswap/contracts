import { ClaimKey } from '@coinweb/contract-kit';
import type { PubKey } from '@coinweb/wallet-lib';

import {
  createActivePositionIndexFirstPart,
  createBestPositionIndexFirstPart,
  createDateIndexFirstPart,
  createPositionStateKey,
  createUserIndexFirstPart,
} from './shared/keys';
import { PositionStateClaimBody } from './shared/types';
import { Client, PositionData } from './types';

export const getActivePositionIds = async (client: Client): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createActivePositionIndexFirstPart(), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getBestPositionIds = async (client: Client): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createBestPositionIndexFirstPart(), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getLastPositionIds = async (client: Client): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createDateIndexFirstPart(), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getUserPositionIds = async (client: Client, pubKey: PubKey): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createUserIndexFirstPart(pubKey), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getPositionById = async (client: Client, id: string) => {
  const key = createPositionStateKey(id);

  const claimResponse = (await client.fetchClaims(key.first_part, key.second_part))[0];

  if (!claimResponse) {
    throw new Error('Position not found');
  }

  const data = claimResponse.content.body as PositionStateClaimBody;

  return {
    id,
    baseAmount: BigInt(data.baseAmount),
    quoteAmount: BigInt(data.quoteAmount),
    recipient: data.recipient,
    createdAt: data.createdAt,
    activityStatus: data.activityStatus,
    paymentStatus: data.paymentStatus,
    funds: BigInt(data.funds),
  } satisfies PositionData;
};
