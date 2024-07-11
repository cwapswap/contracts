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
  deactivateOrder,
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

export const cwebMain = () => {
  const module: ContractHandlers = { handlers: {} };

  addMethodHandler(module, PUBLIC_METHODS.CREATE_ORDER, createOrderPublic);
  addMethodHandler(module, PRIVATE_METHODS.CREATE_ORDER, createOrder);

  addMethodHandler(module, PUBLIC_METHODS.CHANGE_ORDER, changeOrderPublic);
  addMethodHandler(module, PRIVATE_METHODS.CHANGE_ORDER, changeOrder);

  addMethodHandler(module, PRIVATE_METHODS.HANDLE_EXECUTION_BLOCK_TRIGGERED, handleExecutionBlockTriggered);

  addMethodHandler(module, PUBLIC_METHODS.CANCEL_ORDER, cancelOrderPublic);
  addMethodHandler(module, PRIVATE_METHODS.DEACTIVATE_ORDER, deactivateOrder);
  addMethodHandler(module, PRIVATE_METHODS.CLOSE_ORDER, closeOrder);

  addMethodHandler(module, PUBLIC_METHODS.REQUEST_EXECUTION, handleExecutionRequestPublic);
  addMethodHandler(module, PRIVATE_METHODS.PREPARE_EXECUTION_REQUEST, prepareRequest);
  addMethodHandler(module, PRIVATE_METHODS.CREATE_EXECUTION_REQUEST, createRequest);

  addMethodHandler(module, PUBLIC_METHODS.CHANGE_CONTRACT_OWNER, changeContractOwnerPublic);
  addMethodHandler(module, PRIVATE_METHODS.CHANGE_CONTRACT_OWNER, changeContractOwner);

  addMethodHandler(module, PUBLIC_METHODS.DEPOSIT, depositPublic);
  addMethodHandler(module, PRIVATE_METHODS.DEPOSIT, deposit);

  addMethodHandler(module, PUBLIC_METHODS.WITHDRAW, withdrawPublic);
  addMethodHandler(module, PRIVATE_METHODS.WITHDRAW, withdraw);

  addMethodHandler(module, PRIVATE_METHODS.EXECUTION_FALLBACK, executionFallback);

  addMethodHandler(module, PUBLIC_METHODS.SEED, seed);
  addMethodHandler(module, PRIVATE_METHODS.PREPARE_SEED, prepareSeed);
  addMethodHandler(module, PRIVATE_METHODS.SEED_ORDERS, seedOrders);

  addMethodHandler(module, SELF_REGISTER_HANDLER_NAME, selfRegisterHandler as unknown as MethodCallback);
  executeHandler(module);
};
