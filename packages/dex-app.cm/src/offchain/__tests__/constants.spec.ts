import { Key, ACTIVITY_STATUS, PAYMENT_STATUS, PUBLIC_METHODS } from '../shared/constants';

describe('Key Enum', () => {
  it('should have correct values', () => {
    expect(Key.STATE).toBe('STATE');
    expect(Key.FUNDS).toBe('FUNDS');
    expect(Key.USER_INDEX).toBe('USER_INDEX');
    expect(Key.DATE_INDEX).toBe('DATE_INDEX');
    expect(Key.BEST_INDEX).toBe('BEST_INDEX');
    expect(Key.ACTIVE_INDEX).toBe('ACTIVE_INDEX');
    expect(Key.CLOSED_INDEX).toBe('CLOSED_INDEX');
    expect(Key.CONTRACT_OWNER).toBe('CONTRACT_OWNER');
  });
});

describe('ACTIVITY_STATUS Enum', () => {
  it('should have correct values', () => {
    expect(ACTIVITY_STATUS.ACTIVE).toBe('ACTIVE');
    expect(ACTIVITY_STATUS.COMPLETED).toBe('COMPLETED');
    expect(ACTIVITY_STATUS.CANCELLING).toBe('CANCELLING');
    expect(ACTIVITY_STATUS.CANCELLED).toBe('CANCELLED');
    expect(ACTIVITY_STATUS.EXPIRED).toBe('EXPIRED');
  });
});

describe('PAYMENT_STATUS Enum', () => {
  it('should have correct values', () => {
    expect(PAYMENT_STATUS.PAYABLE).toBe('PAYABLE');
    expect(PAYMENT_STATUS.NOT_PAYABLE).toBe('NOT_PAYABLE');
    expect(PAYMENT_STATUS.PAID).toBe('PAID');
  });
});

describe('PUBLIC_METHODS Enum', () => {
  it('should have correct values', () => {
    expect(PUBLIC_METHODS.CREATE_POSITION).toBe('CREATE_POSITION');
    expect(PUBLIC_METHODS.CANCEL_POSITION).toBe('CANCEL_POSITION');
    expect(PUBLIC_METHODS.CHANGE_CONTRACT_OWNER).toBe('CHANGE_CONTRACT_OWNER');
  });
});
