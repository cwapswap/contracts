import type { Claim, Context } from '@coinweb/contract-kit';
import { getContractId, constructContractIssuer, getMethodArguments, extractContractInfo } from '@coinweb/contract-kit';

import {
  PositionStateClaimBody,
  ACTIVITY_STATUS,
  PAYMENT_STATUS,
  HexBigInt,
  FEE,
  toHex,
  ChainData,
} from '../../../../offchain/shared';
import { CONSTANTS } from '../../../constants';
import { L1Types } from '../../../types';
import {
  createBtcUtxoUniquenessClaim,
  createCreatePositionCallPrivate,
  getInstanceParameters,
  getTime,
  hashClaimBody,
  validateBtcChainData,
} from '../../../utils';

export const createPositionPublic = (context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const [, l1Amount, l1Address, chainData] = getMethodArguments(context) as [unknown, HexBigInt, string, ChainData];

  const parameters = getInstanceParameters();

  const ownerMinFee = BigInt(parameters.owner_min_fee || 0);
  const ownerPercentageFee = BigInt(parameters.owner_percentage_fee || 0);

  const callFee = FEE.CREATE_POSITION;

  let positionAmount = ((availableCweb - callFee) * 100n) / (100n + ownerPercentageFee);

  const calculatedOwnerPercentageFee = (positionAmount * ownerPercentageFee) / 100n;

  let ownerFee = calculatedOwnerPercentageFee;

  if (calculatedOwnerPercentageFee < ownerMinFee) {
    ownerFee = ownerMinFee;
    positionAmount = availableCweb - callFee - ownerFee;
  }

  if (positionAmount <= 0n) {
    throw new Error('Not enough funds to create position');
  }

  const createdAt = getTime();

  const positionState: PositionStateClaimBody = {
    recipient: l1Address,
    baseAmount: toHex(positionAmount),
    quoteAmount: l1Amount,
    activityStatus: ACTIVITY_STATUS.ACTIVE,
    paymentStatus: PAYMENT_STATUS.PAYABLE,
    funds: toHex(positionAmount),
    createdAt,
    expirationDate: createdAt + CONSTANTS.POSITION_LIFE_TIME,
    chainData,
    txId: context.call.txid,
    error: null,
  };

  const positionId = hashClaimBody(positionState);

  let uniqueness: null | Claim;

  if (getInstanceParameters().l1_type === L1Types.Btc) {
    if (!validateBtcChainData(positionState.chainData)) {
      throw new Error('Invalid input data');
    }

    uniqueness = createBtcUtxoUniquenessClaim({
      data: positionState.chainData,
      message: 'UTXO is already in use',
    });
  } else {
    uniqueness = null;
  }

  const issuer = constructContractIssuer(getContractId(tx));

  return createCreatePositionCallPrivate(
    context,
    issuer,
    positionId,
    [positionId, positionState, toHex(ownerFee), uniqueness],
    availableCweb,
    auth,
    uniqueness,
  );
};
