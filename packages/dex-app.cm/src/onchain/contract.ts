import { ContractHandlers, SELF_REGISTER_HANDLER_NAME, addMethodHandler, executeHandler } from '@coinweb/contract-kit';
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

export const cwebMain = () => {
  const module: ContractHandlers = { handlers: {} };

  addMethodHandler(module, PUBLIC_METHODS.CREATE_POSITION, withContractCallLogger(createPositionPublic));
  addMethodHandler(module, PRIVATE_METHODS.CREATE_POSITION, withContractCallLogger(createPosition));

  addMethodHandler(module, PRIVATE_METHODS.HANDLE_BLOCK_TRIGGERED, withContractCallLogger(handleBlockTriggered));

  addMethodHandler(module, PUBLIC_METHODS.CANCEL_POSITION, withContractCallLogger(cancelPositionPublic));
  addMethodHandler(module, PRIVATE_METHODS.DEACTIVATE_POSITION, withContractCallLogger(deactivatePosition));
  addMethodHandler(module, PRIVATE_METHODS.CLOSE_POSITION, withContractCallLogger(closePosition));

  addMethodHandler(module, PUBLIC_METHODS.CHANGE_CONTRACT_OWNER, withContractCallLogger(changeOwnerPublic));
  addMethodHandler(module, PRIVATE_METHODS.CHANGE_CONTRACT_OWNER, withContractCallLogger(changeContractOwner));

  addMethodHandler(module, SELF_REGISTER_HANDLER_NAME, selfRegisterHandler);
  executeHandler(module);
};
