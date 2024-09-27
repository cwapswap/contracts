export enum Key {
  STATE = 'STATE',
  FUNDS = 'FUNDS',
  USER_INDEX = 'USER_INDEX',
  DATE_INDEX = 'DATE_INDEX',
  BEST_BY_QUOTE_INDEX = 'BEST_BY_QUOTE_INDEX',
  ACTIVE_INDEX = 'ACTIVE_INDEX',
  CLOSED_INDEX = 'CLOSED_INDEX',
  ERROR_INDEX = 'ERROR_INDEX',
  UNIQUENESS_CHECK = 'UNIQUENESS_CHECK',
  CONTRACT_OWNER = 'CONTRACT_OWNER',
}

export enum ACTIVITY_STATUS {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLING = 'CANCELLING',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
}

export enum PAYMENT_STATUS {
  PAYABLE = 'PAYABLE',
  NOT_PAYABLE = 'NOT_PAYABLE',
  PAID = 'PAID',
}

export enum PUBLIC_METHODS {
  CREATE_POSITION = '0x01',
  CANCEL_POSITION = '0x02',
  CHANGE_CONTRACT_OWNER = '0x03',
}

export const FEE = {
  CREATE_POSITION: 2000000n,
  CANCEL_POSITION: 1000000n,
};

export enum CallType {
  Accept = 128,
  Transfer = 129,
}

export const BTC_MAIN_NET = {
  bech32: 'bc',
  pubKeyHash: 0x00,
  scriptHash: 0x05,
  wif: 0x80,
};

export const BTC_TEST_NET: typeof BTC_MAIN_NET = {
  bech32: 'tb',
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};

export const BtcShardNetwork = {
  btc: BTC_MAIN_NET,
  tbtc: BTC_TEST_NET,
};
