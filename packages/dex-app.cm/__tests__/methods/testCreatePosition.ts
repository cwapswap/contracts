import { constructContractIssuer, constructContractRef } from '@coinweb/contract-kit';
import { UnitTest, UnitTestContext, ExecInfo, FundsForRound } from '@coinweb/testing-sdk';

import { FEE, PUBLIC_METHODS } from '../../src/offchain';
import { InstanceConfig } from '../contract';

export const testCreatePosition = (config: InstanceConfig, privateKey: Uint8Array) => {
  describe('Test Create Position', async () => {
    const baseAmount = BigInt(100 * 1e18);
    const quoteAmount = 100n;
    const recipient = '0x2F080E97Afe5936D3059a652D1C2fa7cCF619EDa';

    const ownerPercentageFee = (BigInt(config.parameters.owner_percentage_fee ?? 0) * baseAmount) / 100n;
    const ownerMinFee = BigInt(config.parameters.owner_min_fee ?? 0);
    const contractOwnerFee = ownerMinFee > ownerPercentageFee ? ownerMinFee : ownerPercentageFee;

    const withFunds: FundsForRound = { type: { privateKey } };
    const input: ExecInfo = {
      rounds: [
        {
          txsInfo: {
            txs: [
              {
                callInfo: {
                  ref: constructContractRef(constructContractIssuer(config.id), []),
                  methodInfo: { methodName: PUBLIC_METHODS.CREATE_POSITION, methodArgs: [quoteAmount, recipient] },
                  contractArgs: [],
                  contractInfo: {
                    providedCweb: baseAmount + contractOwnerFee + FEE.CREATE_POSITION,
                    authenticated: null,
                  },
                },
                withFunds,
              },
            ],
            l1_events: [],
          },
          claims: [],
        },
      ],
    };

    const context: UnitTestContext = {
      name: 'Create Position flow',
      input,
      checkFn: console.log,
      testPath: `./tests_data/${config.alias.split(' ')[0]}/createPosition`,
      options: {
        verbose: true,
        stateFile: './tests_data/state.json',
      },
    };

    const test = new UnitTest(context);

    return await test.run();
  });
};
