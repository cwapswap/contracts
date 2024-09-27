import { PositionStateClaimBody } from '../../../../offchain';

export type ClosePositionMethodArgs = [
  positionId: string,
  positionData: Omit<PositionStateClaimBody, 'activityStatus' | 'paymentStatus' | 'funds'>,
];
