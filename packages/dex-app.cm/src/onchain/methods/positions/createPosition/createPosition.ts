import type { ClaimKey, Context } from '@coinweb/contract-kit';
import {
  getContractId,
  constructContinueTx,
  constructContractIssuer,
  getMethodArguments,
  extractContractInfo,
  extractContractArgs,
  extractRead,
  passCwebFrom,
  constructStore,
  selfCallWrapper,
  constructClaimKey,
} from '@coinweb/contract-kit';

import { PositionStateClaimBody } from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { L1Types, OwnerClaimBody } from '../../../types';
import {
  constructConditional,
  constructSendCweb,
  createActiveIndexClaim,
  createBestByQuoteIndexClaim,
  createCallWithL1EventBlock,
  createCreatePositionCallPrivate,
  createDateIndexClaim,
  createFundsClaim,
  createPositionStateClaim,
  createUserIndexClaim,
  hashClaimBody,
  constructJumpCall,
  createBestByQuoteActiveIndexClaim,
  getInstanceParameters,
  validateBtcChainData,
  createEvmEventClaimKey,
} from '../../../utils';

export const createPosition = selfCallWrapper((context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const issuer = constructContractIssuer(getContractId(tx));

  const [, positionId, positionState, signer, ownerFee] = getMethodArguments(context) as [
    unknown,
    string,
    PositionStateClaimBody,
    string | undefined,
    string,
  ];

  const contractArgs = extractContractArgs(tx);

  const existingPosition = extractRead(contractArgs[0])?.[0]?.content;

  if (existingPosition) {
    const positionNewId = hashClaimBody(positionState, positionId);

    const transactionFee = 1000n;

    return createCreatePositionCallPrivate(
      context,
      issuer,
      positionNewId,
      [positionNewId, positionState, signer, ownerFee],
      availableCweb - transactionFee,
      auth,
    );
  }

  const contractOwnerClaim = extractRead(contractArgs[1])?.[0]?.content;

  const contractOwner =
    (contractOwnerClaim?.body as OwnerClaimBody | undefined)?.owner || getInstanceParameters().owner;

  let eventClaimKey: ClaimKey;
  let eventNonce: null | bigint;

  if (getInstanceParameters().l1_type === L1Types.Btc) {
    if (!validateBtcChainData(positionState.chainData)) {
      throw new Error('Invalid input data');
    }

    eventClaimKey = constructClaimKey(positionState.chainData.l1TxId, positionState.chainData.vout);
    eventNonce = null;
  } else {
    eventNonce = 0n;
    eventClaimKey = createEvmEventClaimKey(positionId, eventNonce);
  }

  const baseAmount = BigInt(positionState.baseAmount);
  const quoteAmount = BigInt(positionState.quoteAmount);
  const jumpContractFee = 2000n;
  const firstTransactionFee = 2700n + baseAmount + BigInt(ownerFee) + jumpContractFee;

  const secondTransactionFee = 1200n;

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(issuer, firstTransactionFee),
        constructStore(
          createPositionStateClaim({
            id: positionId,
            body: positionState,
          }),
        ),
        constructStore(
          createFundsClaim({
            positionId,
            owner: signer,
            baseAmount: positionState.baseAmount,
            quoteAmount: positionState.quoteAmount,
            amount: baseAmount,
          }),
        ),
        constructStore(
          createActiveIndexClaim({
            timestamp: positionState.createdAt,
            positionId,
          }),
        ),
        constructStore(
          createBestByQuoteActiveIndexClaim({
            baseAmount,
            quoteAmount,
            positionId,
          }),
        ),
        constructStore(
          createDateIndexClaim({
            timestamp: positionState.createdAt,
            positionId,
          }),
        ),
        constructStore(
          createBestByQuoteIndexClaim({
            baseAmount,
            quoteAmount,
            positionId,
          }),
        ),
        ...constructConditional(
          !!signer,
          constructStore(
            createUserIndexClaim({
              pubKey: signer!,
              timestamp: positionState.createdAt,
              positionId,
            }),
          ),
        ),
        ...constructSendCweb(BigInt(ownerFee), contractOwner, null),
      ],
      constructJumpCall(eventClaimKey, jumpContractFee),
    ),
    constructContinueTx(
      context,
      [],
      createCallWithL1EventBlock({
        methodName: PRIVATE_METHODS.HANDLE_BLOCK_TRIGGERED,
        issuer,
        providedCweb: availableCweb - secondTransactionFee - firstTransactionFee,
        authenticated: auth,
        eventNonce,
        positionId,
        positionState,
        withExpiration: !!signer,
        eventClaimKey,
      }),
    ),
  ];
});
