import { ORDER_ACTIVITY_STATUS } from '../../../../offchain/shared';

export type DeactivateOrderPrivateArguments = [
  id: string,
  statusReason: ORDER_ACTIVITY_STATUS.EXPIRED | ORDER_ACTIVITY_STATUS.CANCELLED,
];
export type CloseOrderPrivateArguments = [
  id: string,
  statusReason: ORDER_ACTIVITY_STATUS.EXPIRED | ORDER_ACTIVITY_STATUS.CANCELLED,
];
