import type { Claim, ClaimKey, Context } from '@coinweb/contract-kit';
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
  constructClaimKey,
} from '@coinweb/contract-kit';

import {
  ACTIVITY_STATUS,
  PAYMENT_STATUS,
  PositionStateClaimBody,
  toHex,
  UniquenessClaimBody,
} from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { L1Types, OwnerClaimBody } from '../../../types';
import {
  constructConditional,
  getUser,
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
  createErrorByDateIndexClaim,
  constructNonNullable,
} from '../../../utils';

export const createPosition = (context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const issuer = constructContractIssuer(getContractId(tx));

  const [, positionId, positionState, ownerFee, uniqueness] = getMethodArguments(context) as [
    unknown,
    string,
    PositionStateClaimBody,
    string,
    null | Claim,
  ];

  const signer = getUser(context);

  const contractArgs = extractContractArgs(tx);

  const existingPosition = extractRead(contractArgs[0])?.[0]?.content;

  if (existingPosition) {
    const positionNewId = hashClaimBody(positionState, positionId);

    const transactionFee = 1000n;

    return createCreatePositionCallPrivate(
      context,
      issuer,
      positionNewId,
      [positionNewId, positionState, ownerFee, uniqueness],
      availableCweb - transactionFee,
      auth,
      uniqueness,
    );
  }

  const existingUniqueness = extractRead(contractArgs[2])?.[0]?.content;

  const baseAmount = BigInt(positionState.baseAmount);
  const quoteAmount = BigInt(positionState.quoteAmount);

  if (existingUniqueness) {
    return [
      constructContinueTx(context, [
        passCwebFrom(issuer, availableCweb),
        ...constructSendCweb(BigInt(baseAmount), signer, null),
        constructStore(
          createPositionStateClaim({
            id: positionId,
            body: {
              ...positionState,
              activityStatus: ACTIVITY_STATUS.ERROR,
              paymentStatus: PAYMENT_STATUS.NOT_PAYABLE,
              funds: toHex(0),
              error: (existingUniqueness.body as UniquenessClaimBody).message,
            },
          }),
        ),
        constructStore(
          createErrorByDateIndexClaim({
            timestamp: positionState.createdAt,
            positionId,
          }),
        ),
        constructStore(
          createDateIndexClaim({
            timestamp: positionState.createdAt,
            positionId,
          }),
        ),
        ...constructConditional(
          signer.auth === 'EcdsaContract',
          constructStore(
            createUserIndexClaim({
              user: signer,
              timestamp: positionState.createdAt,
              positionId,
            }),
          ),
        ),
      ]),
    ];
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

  const jumpContractFee = 2000n;
  const firstTransactionFee = 2800n + baseAmount + BigInt(ownerFee) + jumpContractFee;

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
        ...constructNonNullable(uniqueness, (uniqueness) => [constructStore(uniqueness)]),
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
          signer.auth === 'EcdsaContract',
          constructStore(
            createUserIndexClaim({
              user: signer,
              timestamp: positionState.createdAt,
              positionId,
            }),
          ),
        ),
        ...constructSendCweb(BigInt(ownerFee), contractOwner, null),
      ],
      constructJumpCall(eventClaimKey, jumpContractFee),
    ),
    createCallWithL1EventBlock(context, {
      methodName: PRIVATE_METHODS.HANDLE_BLOCK_TRIGGERED,
      issuer,
      providedCweb: availableCweb - secondTransactionFee - firstTransactionFee,
      authenticated: auth,
      eventNonce,
      positionId,
      positionState,
      withExpiration: signer.auth === 'EcdsaContract',
      eventClaimKey,
    }),
  ];
};
