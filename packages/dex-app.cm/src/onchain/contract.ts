import {
  ContractHandlers,
  MethodCallback,
  SELF_REGISTER_HANDLER_NAME,
  addMethodHandler,
  applyQueue,
  executeHandler,
  selfCallWrapper,
  withContinuations,
} from '@coinweb/contract-kit';
import { selfRegisterHandler } from '@coinweb/self-register';

import { PUBLIC_METHODS } from '../offchain/shared';

import { PRIVATE_METHODS } from './constants';
import {
  cancelPositionPublic,
  changeContractOwner,
  changeOwnerPublic,
  closePosition,
  createPosition,
  createPositionPublic,
  deactivatePosition,
  handleBlockTriggered,
} from './methods';
import { withContractCallLogger } from './utils';

const addWrappers = (method: MethodCallback): MethodCallback => {
  return withContinuations(selfCallWrapper(withContractCallLogger(method)));
};

export const cwebMain = () => {
  const module: ContractHandlers = { handlers: {} };

  addMethodHandler(module, PUBLIC_METHODS.CREATE_POSITION, addWrappers(createPositionPublic));
  addMethodHandler(module, PRIVATE_METHODS.CREATE_POSITION, addWrappers(createPosition));

  addMethodHandler(module, PRIVATE_METHODS.HANDLE_BLOCK_TRIGGERED, addWrappers(handleBlockTriggered));

  addMethodHandler(module, PUBLIC_METHODS.CANCEL_POSITION, addWrappers(cancelPositionPublic));
  addMethodHandler(module, PRIVATE_METHODS.DEACTIVATE_POSITION, addWrappers(deactivatePosition));
  addMethodHandler(module, PRIVATE_METHODS.CLOSE_POSITION, addWrappers(closePosition));

  addMethodHandler(module, PUBLIC_METHODS.CHANGE_CONTRACT_OWNER, addWrappers(changeOwnerPublic));
  addMethodHandler(module, PRIVATE_METHODS.CHANGE_CONTRACT_OWNER, addWrappers(changeContractOwner));

  addMethodHandler(module, SELF_REGISTER_HANDLER_NAME, selfRegisterHandler);

  applyQueue(module, [
    PUBLIC_METHODS.CANCEL_POSITION,
    PUBLIC_METHODS.CHANGE_CONTRACT_OWNER,
    PUBLIC_METHODS.CREATE_POSITION,
  ]);

  executeHandler(module);
};
