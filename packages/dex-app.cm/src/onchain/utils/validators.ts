import { BtcChainData } from '../../offchain/shared';

export const validateBtcChainData = (data: unknown): data is BtcChainData => {
  return (
    data !== null &&
    typeof data === 'object' &&
    typeof (data as Partial<BtcChainData>).l1TxId === 'string' &&
    typeof (data as Partial<BtcChainData>).vout === 'number'
  );
};
