import type { Context, User } from '@coinweb/contract-kit';
import {
  getContractId,
  constructContractIssuer,
  getMethodArguments,
  extractContractInfo,
  extractContractArgs,
  extractRead,
} from '@coinweb/contract-kit';

import { PositionStateClaimBody, HexBigInt, PositionFundsClaimBody, CallType } from '../../../../offchain/shared';
import { TypedClaim } from '../../../types';
import { parseL1EventClaimBody, unwrapEventClaim } from '../../../utils';

import { handleAccept } from './handleAccept';
import { handleClosed } from './handleClosed';
import { handleExpiration } from './handleExpiration';
import { handleTransfer } from './handleTransfer';

export const handleBlockTriggered = (context: Context) => {
  const { tx } = context;

  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const selfId = getContractId(tx);
  const issuer = constructContractIssuer(selfId);

  const [, positionId, nonce] = getMethodArguments(context) as [unknown, string, HexBigInt | null];

  const contractArgs = extractContractArgs(tx);

  const positionFundsClaim = extractRead(contractArgs[1])?.[0]?.content as
    | TypedClaim<PositionFundsClaimBody>
    | undefined;

  const positionStoredAmount = positionFundsClaim?.fees_stored;

  const closedBlockClaim = extractRead(contractArgs[4])?.[0]?.content;

  //TODO: Check this case and then remove "&& !positionStoredAmount". I guess if the position is closed, it have no funds
  if (closedBlockClaim && !positionStoredAmount) {
    return handleClosed();
  }

  if (!positionStoredAmount) {
    throw new Error('Position is insolvent now');
  }

  const positionStateClaim = extractRead(contractArgs[2])?.[0]?.content as
    | TypedClaim<PositionStateClaimBody>
    | undefined;

  const positionState = positionStateClaim?.body;

  if (!positionState) {
    throw new Error('Position does not exists');
  }

  const eventClaim = unwrapEventClaim(extractRead(contractArgs[0])?.[0]?.content);

  if (eventClaim) {
    const eventData = parseL1EventClaimBody(eventClaim.body);

    // This is the call type we get when someone tries to take the order
    if (eventData.callType === CallType.Transfer) {
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
        eventData.paidAmount,
        eventData.recipient,
        {
          l2Contract: eventData.nextContractId,
          l2MethodName: eventData.nextContractMethod,
          l2Args: [
            eventData.quoteAmount,
            eventData.quoteRecipient,
            eventData.fallbackContractId,
            eventData.fallbackContractMethod,
          ],
        },
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
      eventData.paidAmount,
      //TODO! Change event data to support user
      {
        auth: 'EcdsaContract',
        payload: eventData.baseRecipient,
      } satisfies User,
      eventData.recipient,
    );
  }

  const expirationBlockClaim = extractRead(contractArgs[3])?.[0]?.content;

  if (expirationBlockClaim) {
    return handleExpiration(context, issuer, positionId, positionState, positionFundsClaim, availableCweb);
  }

  throw new Error(`An error has occurred while trying to process the position ${positionId}`);
};
