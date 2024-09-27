import { ClaimKey } from '@coinweb/contract-kit';
import { type User } from '@coinweb/wallet-lib';

import {
  createActiveOrderIndexFirstPart,
  createBestActiveOrderIndexFirstPart,
  createBestOrderIndexFirstPart,
  createMakerDepositFirstPart,
  createOrderByOwnerIndexFirstPart,
  createOrderStateKey,
  OrderStateClaimBody,
  createRequestByMarketMakerIndexFirstPart,
  createRequestStateKey,
  RequestStateClaimBody,
} from './shared';
import { ExecutionRequest, Client, Order } from './types';

export const getOrderById = async (client: Client, id: string) => {
  const key = createOrderStateKey(id);

  const claimResponse = (await client.fetchClaims(key.first_part, key.second_part))[0];

  if (!claimResponse) {
    throw new Error('Order not found');
  }

  const data = claimResponse.content.body as OrderStateClaimBody;

  return {
    ...data,
    id,
    baseAmount: BigInt(data.baseAmount),
    quoteAmount: BigInt(data.l1Amount),
    collateral: BigInt(data.collateral),
    covering: BigInt(data.covering),
  } satisfies Order;
};

export const getClaimById = async (client: Client, id: string) => {
  const key = createRequestStateKey(id);

  const claimResponse = (await client.fetchClaims(key.first_part, key.second_part))[0];

  if (!claimResponse) {
    throw new Error('Claim not found');
  }

  const data = claimResponse.content.body as RequestStateClaimBody;

  const {
    createdAt,
    executionStatus,
    expirationDate,
    fallbackContractId,
    fallbackMethodName,
    quoteWallet,
    requestedOrderId,
    txId,
  } = data;

  return {
    id,
    baseAmount: BigInt(data.baseAmount),
    quoteAmount: BigInt(data.promisedQuoteAmount),
    collateral: BigInt(data.collateral),
    createdAt,
    executionStatus,
    expirationDate,
    fallbackContractId,
    fallbackMethodName,
    quoteWallet,
    requestedOrderId,
    txId,
  } satisfies ExecutionRequest;
};

export const getAllOwnOrdersIds = async (client: Client, owner: User): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createOrderByOwnerIndexFirstPart(owner), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getAllOwnClaimIds = async (client: Client, owner: User): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createRequestByMarketMakerIndexFirstPart(owner), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getAllActiveOrdersIds = async (client: Client): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createActiveOrderIndexFirstPart(), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getBestOrdersIds = async (client: Client): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createBestOrderIndexFirstPart(), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getBestActiveOrdersIds = async (client: Client): Promise<string[]> => {
  const claimsResponse = await client.fetchClaims(createBestActiveOrderIndexFirstPart(), null);

  return claimsResponse.map(({ content }) => ((content.key as ClaimKey).second_part as [number, string])[1]);
};

export const getAllOwnOrders = async (client: Client, owner: User) => {
  const ids = await getAllOwnOrdersIds(client, owner);

  const orders = await Promise.all(ids.map((id) => getOrderById(client, id)));

  return orders;
};

export const getAllOwnClaims = async (client: Client, owner: User) => {
  const ids = await getAllOwnClaimIds(client, owner);

  const claims = await Promise.all(ids.map((id) => getClaimById(client, id)));

  return claims;
};

export const getAllActiveOrders = async (client: Client) => {
  const ids = await getAllActiveOrdersIds(client);

  const orders = await Promise.all(ids.map((id) => getOrderById(client, id)));

  return orders;
};

export const getBestOrders = async (client: Client) => {
  const ids = await getBestOrdersIds(client);

  const orders = await Promise.all(ids.map((id) => getOrderById(client, id)));

  return orders;
};

export const getBestActiveOrders = async (client: Client) => {
  const ids = await getBestActiveOrdersIds(client);

  const orders = await Promise.all(ids.map((id) => getOrderById(client, id)));

  return orders;
};

export const getBalance = async (client: Client, owner: User) => {
  const claimsResponse = await client.fetchClaims(createMakerDepositFirstPart(), [owner]);

  return claimsResponse[0];
};
