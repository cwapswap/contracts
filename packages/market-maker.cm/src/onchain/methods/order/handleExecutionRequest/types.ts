import { HexBigInt, OrderStateClaimBody, RequestStateClaimBody } from '../../../../offchain/shared';

export type InitialRequestData = Omit<RequestStateClaimBody, 'collateral' | 'requestedOrderId' | 'quoteAmount'>;

export type PrepareRequestPrivateArguments = [
  id: string,
  initialRequestData: InitialRequestData,
  quoteAmount: HexBigInt,
];

export type CreateRequestPrivateArguments = [
  id: string,
  initialRequestData: InitialRequestData,
  quoteAmount: HexBigInt,
  orderId: string,
  orderState: OrderStateClaimBody,
];

export type HandleExecutionRequestArguments = [
  quoteAmount: HexBigInt,
  quoteWallet: string,
  fallbackContractId: string,
  fallbackMethodName: string,
];
