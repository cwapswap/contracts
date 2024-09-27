import { HexBigInt, OrderStateClaimBody, RequestStateClaimBody } from '../../../../offchain/shared';

export type InitialRequestData = Omit<RequestStateClaimBody, 'collateral' | 'requestedOrderId' | 'promisedQuoteAmount'>;

export type PrepareRequestPrivateArguments = [id: string, initialRequestData: InitialRequestData];

export type CreateRequestPrivateArguments = [
  id: string,
  initialRequestData: InitialRequestData,
  promisedQuoteAmount: HexBigInt,
  orderId: string,
  orderState: OrderStateClaimBody,
];

export type HandleExecutionRequestArguments = [
  quoteAmount: HexBigInt,
  quoteWallet: string,
  fallbackContractId: string,
  fallbackMethodName: string,
];
