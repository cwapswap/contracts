import {
  Context,
  constructContinueTx,
  constructStore,
  constructTake,
  passCwebFrom,
  selfCallWrapper,
} from '@coinweb/contract-kit';

import { MakerDepositClaimBody, createMakerDepositKey } from '../../../../offchain/shared';
import { ContractOwnerClaimBody, TypedClaim } from '../../../types';
import {
  constructConditional,
  constructSendCweb,
  createContractOwnerClaim,
  createMakerDepositClaim,
  getCallParameters,
  getContractIssuer,
  getInstanceParameters,
  getMethodArguments,
  getReadClaimByIndex,
  getUser,
} from '../../../utils';

import { DepositPrivateArguments } from './types';

export const deposit = selfCallWrapper((context: Context) => {
  const { availableCweb } = getCallParameters(context);

  const [depositAmount, providedContractOwnerFee] = getMethodArguments<DepositPrivateArguments>(context);

  const existedDepositClaim = getReadClaimByIndex<TypedClaim<MakerDepositClaimBody>>(context)(0);
  const existedContractOwnerClaim = getReadClaimByIndex<TypedClaim<ContractOwnerClaimBody>>(context)(1);

  const totalDeposit = BigInt(depositAmount) + BigInt(existedDepositClaim?.fees_stored || 0);

  const issuer = getContractIssuer(context);
  const user = existedDepositClaim?.body.owner ?? getUser(context);
  const ownerFee = BigInt(providedContractOwnerFee);
  const contractOwner = getInstanceParameters().owner;

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, availableCweb),
      ...constructConditional(!!existedDepositClaim, constructTake(createMakerDepositKey(user))),
      constructStore(createMakerDepositClaim({ user, amount: totalDeposit })),
      ...constructConditional(
        !!ownerFee && !existedContractOwnerClaim,
        constructStore(createContractOwnerClaim({ owner: contractOwner })),
      ),
      ...constructConditional(!!ownerFee, constructSendCweb(BigInt(ownerFee), contractOwner.payload as string, null)), //TODO! handle contract as contract owner case
    ]),
  ];
});
