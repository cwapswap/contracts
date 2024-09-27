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
  cancelOrderPublic,
  changeContractOwner,
  changeContractOwnerPublic,
  changeOrder,
  changeOrderPublic,
  closeOrder,
  createOrder,
  createOrderPublic,
  deposit,
  depositPublic,
  createRequest,
  handleExecutionRequestPublic,
  withdraw,
  withdrawPublic,
  handleExecutionBlockTriggered,
  prepareRequest,
} from './methods';
import { withContractCallLogger } from './utils';

const addWrappers = (method: MethodCallback): MethodCallback => {
  return withContinuations(selfCallWrapper(withContractCallLogger(method)));
};

export const cwebMain = () => {
  const module: ContractHandlers = { handlers: {} };

  addMethodHandler(module, PUBLIC_METHODS.CREATE_ORDER, addWrappers(createOrderPublic));
  addMethodHandler(module, PRIVATE_METHODS.CREATE_ORDER, addWrappers(createOrder));

  addMethodHandler(module, PUBLIC_METHODS.CHANGE_ORDER, addWrappers(changeOrderPublic));
  addMethodHandler(module, PRIVATE_METHODS.CHANGE_ORDER, addWrappers(changeOrder));

  addMethodHandler(
    module,
    PRIVATE_METHODS.HANDLE_EXECUTION_BLOCK_TRIGGERED,
    addWrappers(handleExecutionBlockTriggered),
  );

  addMethodHandler(module, PUBLIC_METHODS.CANCEL_ORDER, addWrappers(cancelOrderPublic));
  addMethodHandler(module, PRIVATE_METHODS.CLOSE_ORDER, addWrappers(closeOrder));

  addMethodHandler(module, PUBLIC_METHODS.REQUEST_EXECUTION, addWrappers(handleExecutionRequestPublic));
  addMethodHandler(module, PRIVATE_METHODS.PREPARE_EXECUTION_REQUEST, addWrappers(prepareRequest));
  addMethodHandler(module, PRIVATE_METHODS.CREATE_EXECUTION_REQUEST, addWrappers(createRequest));

  addMethodHandler(module, PUBLIC_METHODS.CHANGE_CONTRACT_OWNER, addWrappers(changeContractOwnerPublic));
  addMethodHandler(module, PRIVATE_METHODS.CHANGE_CONTRACT_OWNER, addWrappers(changeContractOwner));

  addMethodHandler(module, PUBLIC_METHODS.DEPOSIT, addWrappers(depositPublic));
  addMethodHandler(module, PRIVATE_METHODS.DEPOSIT, addWrappers(deposit));

  addMethodHandler(module, PUBLIC_METHODS.WITHDRAW, addWrappers(withdrawPublic));
  addMethodHandler(module, PRIVATE_METHODS.WITHDRAW, addWrappers(withdraw));

  addMethodHandler(module, SELF_REGISTER_HANDLER_NAME, selfRegisterHandler as unknown as MethodCallback);
  applyQueue(module, [
    PUBLIC_METHODS.CREATE_ORDER,
    PUBLIC_METHODS.CHANGE_ORDER,
    PUBLIC_METHODS.CANCEL_ORDER,
    PUBLIC_METHODS.REQUEST_EXECUTION,
    PUBLIC_METHODS.CHANGE_CONTRACT_OWNER,
    PUBLIC_METHODS.DEPOSIT,
    PUBLIC_METHODS.WITHDRAW,
  ]);
  executeHandler(module);
};
