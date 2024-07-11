import { ClaimKey } from '@coinweb/contract-kit';
import { type User } from '@coinweb/wallet-lib';

import {
  createActiveOrderIndexFirstPart,
  createMakerDepositFirstPart,
  createOrderByOwnerIndexFirstPart,
  createOrderStateKey,
  OrderStateClaimBody,
} from './shared';
import { Client, Order } from './types';

export const getPositionById = async (client: Client, id: string) => {
  const key = createOrderStateKey(id);

  const claimResponse = (await client.fetchClaims(key.first_part, key.second_part))[0];

  if (!claimResponse) {
    throw new Error('Position not found');
  }

  const data = claimResponse.content.body as OrderStateClaimBody;

  return {
    ...data,
    id,
    baseAmount: BigInt(data.baseAmount),
    quoteAmount: BigInt(data.quoteAmount),
    collateral: BigInt(data.collateral),
  } satisfies Order;
};

export const getAllOwnOrdersIds = async (client: Client, owner: User): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createOrderByOwnerIndexFirstPart(owner), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getAllActiveOrdersIds = async (client: Client): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createActiveOrderIndexFirstPart(), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getAllOwnOrders = async (client: Client, owner: User) => {
  const ids = await getAllOwnOrdersIds(client, owner);

  const orders = await Promise.all(ids.map((id) => getPositionById(client, id)));

  return orders;
};

export const getAllActiveOrders = async (client: Client) => {
  const ids = await getAllActiveOrdersIds(client);

  const orders = await Promise.all(ids.map((id) => getPositionById(client, id)));

  return orders;
};

export const getBalance = async (client: Client, owner: User) => {
  const claimsResponse = await client.fetchClaims(createMakerDepositFirstPart(), [owner]);

  return claimsResponse[0];
};
