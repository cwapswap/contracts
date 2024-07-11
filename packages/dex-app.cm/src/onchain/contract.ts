import {
  ContractHandlers,
  MethodCallback,
  SELF_REGISTER_HANDLER_NAME,
  addMethodHandler,
  executeHandler,
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

export const cwebMain = () => {
  const module: ContractHandlers = { handlers: {} };

  addMethodHandler(module, PUBLIC_METHODS.CREATE_POSITION, createPositionPublic);
  addMethodHandler(module, PRIVATE_METHODS.CREATE_POSITION, createPosition);

  addMethodHandler(module, PRIVATE_METHODS.HANDLE_BLOCK_TRIGGERED, handleBlockTriggered);

  addMethodHandler(module, PUBLIC_METHODS.CANCEL_POSITION, cancelPositionPublic);
  addMethodHandler(module, PRIVATE_METHODS.DEACTIVATE_POSITION, deactivatePosition);
  addMethodHandler(module, PRIVATE_METHODS.CLOSE_POSITION, closePosition);

  addMethodHandler(module, PUBLIC_METHODS.CHANGE_CONTRACT_OWNER, changeOwnerPublic);
  addMethodHandler(module, PRIVATE_METHODS.CHANGE_CONTRACT_OWNER, changeContractOwner);

  addMethodHandler(module, SELF_REGISTER_HANDLER_NAME, selfRegisterHandler as unknown as MethodCallback);
  executeHandler(module);
};
