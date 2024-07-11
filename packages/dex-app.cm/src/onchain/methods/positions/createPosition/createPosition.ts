import type { Context } from '@coinweb/contract-kit';
import {
  getContractId,
  constructContinueTx,
  constructContractIssuer,
  getMethodArguments,
  extractContractInfo,
  getParameters,
  extractContractArgs,
  extractRead,
  passCwebFrom,
  constructStore,
  selfCallWrapper,
} from '@coinweb/contract-kit';

import { PositionStateClaimBody } from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { ContractConfig, OwnerClaimBody } from '../../../types';
import {
  constructConditional,
  constructSendCweb,
  createActiveIndexClaim,
  createBestPositionIndexClaim,
  createCallWithL1EventBlock,
  createCheckPositionCall,
  createDateIndexClaim,
  createFundsClaim,
  createOwnerClaim,
  createPositionStateClaim,
  createUserIndexClaim,
  hashClaimBody,
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
    string,
    string,
  ];

  const contractArgs = extractContractArgs(tx);

  const existingPosition = extractRead(contractArgs[0])?.[0]?.content;

  if (existingPosition) {
    const positionNewId = hashClaimBody(positionState, positionId);

    const transactionFee = 1000n;

    return createCheckPositionCall(
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
    (contractOwnerClaim?.body as OwnerClaimBody | undefined)?.owner ||
    (getParameters('contract/parameters.json') as ContractConfig).owner;

  const baseAmount = BigInt(positionState.baseAmount);
  const quoteAmount = BigInt(positionState.quoteAmount);
  const firstTransactionFee = 2700n + baseAmount + BigInt(ownerFee);

  const secondTransactionFee = 1200n;

  return [
    constructContinueTx(context, [
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
        createDateIndexClaim({
          timestamp: positionState.createdAt,
          positionId,
        }),
      ),
      constructStore(
        createBestPositionIndexClaim({
          baseAmount,
          quoteAmount,
          positionId,
        }),
      ),
      constructStore(
        createUserIndexClaim({
          pubKey: signer,
          timestamp: positionState.createdAt,
          positionId,
        }),
      ),
      ...constructConditional(
        !contractOwnerClaim,
        constructStore(
          createOwnerClaim({
            owner: contractOwner,
          }),
        ),
      ),
      ...constructSendCweb(BigInt(ownerFee), contractOwner, null),
    ]),
    constructContinueTx(
      context,
      [],
      createCallWithL1EventBlock(
        PRIVATE_METHODS.HANDLE_BLOCK_TRIGGERED,
        issuer,
        availableCweb - secondTransactionFee - firstTransactionFee,
        auth,
        0n,
        positionId,
        positionState,
      ),
    ),
  ];
});
