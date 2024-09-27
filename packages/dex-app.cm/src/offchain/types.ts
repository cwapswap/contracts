import type { GqlIssuedClaim } from '@coinweb/wallet-lib';

import { BtcChainData, ChainData, PositionStateClaimBody } from './shared';

export type CreatePositionRequestData = {
  contractId: string;
  baseAmount: string;
  quoteAmount: string;
  recipient: string;
  contractOwnerFee: string;
  chainData?: ChainData;
};

export type CreatePositionBtcRequestData = Omit<CreatePositionRequestData, 'chainData'> & { chainData: BtcChainData };
export type CreatePositionEvmRequestData = Omit<CreatePositionRequestData, 'chainData'>;

export type CancelPositionRequestData = {
  contractId: string;
  positionId: string;
};

export type IssuedClaim = GqlIssuedClaim & {
  content: {
    key: {
      first_part: string;
      second_part: string;
    };
  };
};

export type Pagination = {
  limit: number;
  offset: number;
};

type PositionDataTransformed = {
  id: string;
  baseAmount: bigint;
  quoteAmount: bigint;
  funds: bigint;
  chainData?: ChainData;
};

export type PositionData = PositionDataTransformed & Omit<PositionStateClaimBody, keyof PositionDataTransformed>;

export type Client = {
  fetchClaims<T extends NonNullable<unknown>>(
    firstPart: NonNullable<unknown>,
    secondPart: T | null,
    range?: {
      start: T;
      end: T;
    },
  ): Promise<GqlIssuedClaim[]>;
};
