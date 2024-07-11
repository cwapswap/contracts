import type { Context } from '@coinweb/contract-kit';
import {
  getContractId,
  constructContractIssuer,
  getMethodArguments,
  extractContractInfo,
  extractContractArgs,
  extractRead,
  selfCallWrapper,
} from '@coinweb/contract-kit';

import { PositionStateClaimBody, HexBigInt, PositionFundsClaimBody } from '../../../../offchain/shared';
import { L1EventClaimBody, TypedClaim } from '../../../types';
import { parseL1EventData } from '../../../utils';

import { handleAccept } from './handleAccept';
import { handleClosed } from './handleClosed';
import { handleExpiration } from './handleExpiration';
import { handleTransfer } from './handleTransfer';

export const handleBlockTriggered = selfCallWrapper((context: Context) => {
  const { tx } = context;

  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const issuer = constructContractIssuer(getContractId(tx));

  const [, positionId, nonce, positionState] = getMethodArguments(context) as [
    unknown,
    string,
    HexBigInt,
    PositionStateClaimBody,
  ];

  const contractArgs = extractContractArgs(tx);

  const positionFundsClaim = extractRead(contractArgs[1])?.[0]?.content as
    | TypedClaim<PositionFundsClaimBody>
    | undefined;

  const positionStoredAmount = positionFundsClaim?.fees_stored;

  if (!positionStoredAmount) {
    throw new Error('Position is insolvent now');
  }

  const eventClaim = extractRead(contractArgs[0])?.[0]?.content as TypedClaim<L1EventClaimBody> | undefined;

  if (eventClaim) {
    const { cwebAddress, paidAmount, recipient, callContractData } = parseL1EventData(eventClaim.body.data);

    if (callContractData) {
      return handleTransfer(
        context,
        issuer,
        positionId,
        nonce,
        positionState,
        positionStoredAmount,
        positionFundsClaim,
        availableCweb,
        auth,
        paidAmount,
        cwebAddress,
        recipient,
        callContractData,
      );
    }

    return handleAccept(
      context,
      issuer,
      positionId,
      nonce,
      positionState,
      positionStoredAmount,
      positionFundsClaim,
      availableCweb,
      auth,
      paidAmount,
      cwebAddress,
      recipient,
    );
  }

  const expirationBlockClaim = extractRead(contractArgs[2])?.[0]?.content;

  if (expirationBlockClaim) {
    return handleExpiration(context, issuer, positionId, positionState, positionFundsClaim, availableCweb);
  }

  const closedBlockClaim = extractRead(contractArgs[3])?.[0]?.content;

  if (closedBlockClaim) {
    return handleClosed();
  }

  throw new Error(`An error has occurred while trying to process the position ${positionId}`);
});
