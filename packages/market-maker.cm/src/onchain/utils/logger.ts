/* eslint-disable no-console */
import {
  Context,
  extractBlock,
  extractContractArgs,
  extractContractInfo,
  extractRead,
  extractTake,
  getMethodArguments,
  isResolvedBlock,
  isResolvedData,
  isResolvedRead,
  isResolvedStore,
  isResolvedTake,
  MethodCallback,
  ResolvedOperation,
} from '@coinweb/contract-kit';

import { toHex } from '../../offchain/shared';
import { Logs } from '../types';

import { getInstanceParameters } from './context';

const normalizeData = (data: unknown) => {
  if (typeof data === 'object') {
    return JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? toHex(v) : v));
  }

  if (data === undefined) {
    return 'undefined';
  }

  return data;
};

export const log = (logType: Logs, data: unknown) => {
  const normalizedData = normalizeData(data);
  const allowedLogs = getInstanceParameters().logs;

  if (allowedLogs?.includes(logType)) {
    switch (logType) {
      case Logs.MethodName:
        console.log(`Method name: ${normalizedData};`);
        break;
      case Logs.ProvidedCweb:
        console.log(`Provided Cweb: ${normalizedData};`);
        break;
      case Logs.MethodArgument:
        console.log(`Method args: ${normalizedData};`);
        break;
      case Logs.ContractArguments:
        console.log(`Contract args: ${normalizedData};`);
        break;
      case Logs.Custom:
      default:
        console.log(normalizeData);
        break;
    }
  }
};

const extractOp = (op: ResolvedOperation) => {
  if (isResolvedRead(op)) {
    return `[ReadOp:] ${extractRead(op)
      ?.map((val) => normalizeData(val.content))
      .join(', ')}`;
  }

  if (isResolvedBlock(op)) {
    return `[BlockOp:] ${extractBlock(op)
      ?.map((val) => normalizeData(val))
      .join(', ')}`;
  }

  if (isResolvedTake(op)) {
    return `[TakeOp:] ${extractTake(op)}`;
  }

  if (isResolvedStore(op)) {
    return '[StoreOp]';
  }

  if (isResolvedData(op)) {
    return '[DataOp]';
  }

  return '[ResolvedOp]';
};

export const withContractCallLogger = (method: MethodCallback) => {
  return (context: Context) => {
    const [methodName, ...methodArgs] = getMethodArguments(context);
    const contractArgs = extractContractArgs(context.tx);
    const { providedCweb } = extractContractInfo(context.tx);

    log(Logs.MethodName, methodName);
    log(Logs.ProvidedCweb, providedCweb);
    log(Logs.MethodArgument, methodArgs.map(normalizeData).join(', '));
    log(Logs.ContractArguments, contractArgs.map(extractOp).join(', '));

    return method(context);
  };
};
