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
  executionFallback,
  createRequest,
  handleExecutionRequestPublic,
  withdraw,
  withdrawPublic,
  handleExecutionBlockTriggered,
  prepareRequest,
} from './methods';
import { seed, prepareSeed, seedOrders } from './methods/seed';
import { withContractCallLogger } from './utils';

export const cwebMain = () => {
  const module: ContractHandlers = { handlers: {} };

  addMethodHandler(module, PUBLIC_METHODS.CREATE_ORDER, withContractCallLogger(createOrderPublic));
  addMethodHandler(module, PRIVATE_METHODS.CREATE_ORDER, withContractCallLogger(createOrder));

  addMethodHandler(module, PUBLIC_METHODS.CHANGE_ORDER, withContractCallLogger(changeOrderPublic));
  addMethodHandler(module, PRIVATE_METHODS.CHANGE_ORDER, withContractCallLogger(changeOrder));

  addMethodHandler(
    module,
    PRIVATE_METHODS.HANDLE_EXECUTION_BLOCK_TRIGGERED,
    withContractCallLogger(handleExecutionBlockTriggered),
  );

  addMethodHandler(module, PUBLIC_METHODS.CANCEL_ORDER, withContractCallLogger(cancelOrderPublic));
  addMethodHandler(module, PRIVATE_METHODS.CLOSE_ORDER, withContractCallLogger(closeOrder));

  addMethodHandler(module, PUBLIC_METHODS.REQUEST_EXECUTION, withContractCallLogger(handleExecutionRequestPublic));
  addMethodHandler(module, PRIVATE_METHODS.PREPARE_EXECUTION_REQUEST, withContractCallLogger(prepareRequest));
  addMethodHandler(module, PRIVATE_METHODS.CREATE_EXECUTION_REQUEST, withContractCallLogger(createRequest));

  addMethodHandler(module, PUBLIC_METHODS.CHANGE_CONTRACT_OWNER, withContractCallLogger(changeContractOwnerPublic));
  addMethodHandler(module, PRIVATE_METHODS.CHANGE_CONTRACT_OWNER, withContractCallLogger(changeContractOwner));

  addMethodHandler(module, PUBLIC_METHODS.DEPOSIT, withContractCallLogger(depositPublic));
  addMethodHandler(module, PRIVATE_METHODS.DEPOSIT, withContractCallLogger(deposit));

  addMethodHandler(module, PUBLIC_METHODS.WITHDRAW, withContractCallLogger(withdrawPublic));
  addMethodHandler(module, PRIVATE_METHODS.WITHDRAW, withContractCallLogger(withdraw));

  addMethodHandler(module, PRIVATE_METHODS.EXECUTION_FALLBACK, withContractCallLogger(executionFallback));

  addMethodHandler(module, PUBLIC_METHODS.SEED, seed);
  addMethodHandler(module, PRIVATE_METHODS.PREPARE_SEED, withContractCallLogger(prepareSeed));
  addMethodHandler(module, PRIVATE_METHODS.SEED_ORDERS, withContractCallLogger(seedOrders));

  addMethodHandler(module, SELF_REGISTER_HANDLER_NAME, selfRegisterHandler as unknown as MethodCallback);
  executeHandler(module);
};
