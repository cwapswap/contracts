import { HexBigInt, RequestStateClaimBody } from '../../../../offchain/shared';

export type PrepareRequestPrivateArguments = [
  baseAmount: HexBigInt,
  quoteWallet: string,
  orderId: string,
  fallbackContractId: string,
  fallbackMethodName: string,
];

export type PreparedRequest = Omit<RequestStateClaimBody, 'collateral'>;

export type CreateRequestPrivateArguments = [id: string, preparedRequest: PreparedRequest];
