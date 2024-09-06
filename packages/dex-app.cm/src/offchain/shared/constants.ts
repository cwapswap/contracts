export enum Key {
  STATE = 'STATE',
  FUNDS = 'FUNDS',
  USER_INDEX = 'USER_INDEX',
  DATE_INDEX = 'DATE_INDEX',
  BEST_BY_QUOTE_INDEX = 'BEST_BY_QUOTE_INDEX',
  ACTIVE_INDEX = 'ACTIVE_INDEX',
  CLOSED_INDEX = 'CLOSED_INDEX',
  CONTRACT_OWNER = 'CONTRACT_OWNER',
}

export enum ACTIVITY_STATUS {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLING = 'CANCELLING',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PAYMENT_STATUS {
  PAYABLE = 'PAYABLE',
  NOT_PAYABLE = 'NOT_PAYABLE',
  PAID = 'PAID',
}

export enum PUBLIC_METHODS {
  CREATE_POSITION = 'CREATE_POSITION',
  CANCEL_POSITION = 'CANCEL_POSITION',
  CHANGE_CONTRACT_OWNER = 'CHANGE_CONTRACT_OWNER',
}

export const FEE = {
  CREATE_POSITION: 100000n,
  CANCEL_POSITION: 50000n,
};

export enum CallType {
  Accept = 128,
  Transfer = 129,
}
