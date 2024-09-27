import {
  ClaimIssuer,
  constructClaim,
  constructClaimKey,
  constructContractIssuer,
  constructContractRef,
  IssuedClaim,
} from '@coinweb/contract-kit';
import {
  UnitTest,
  UnitTestContext,
  ExecInfo,
  FundsForRound,
  DbWriteOp,
  claimSearchByFirstPart,
  RoundInfo,
  isInsertedOp,
} from '@coinweb/testing-sdk';

import { PUBLIC_METHODS } from '../../src/offchain';
import { constructEvmEventForC1, dexAppContractName, instances, marketMakerContractName } from '../contract';

const validateCreation = (): ((results: DbWriteOp[]) => void) => {
  return (results: DbWriteOp[]) => {
    assert(claimSearchByFirstPart(results, ['ACTIVE_INDEX']), 'No active index');
    assert(claimSearchByFirstPart(results, ['BEST_BY_QUOTE_INDEX']), 'No best by quote index');
    assert(claimSearchByFirstPart(results, ['DATE_INDEX']), 'No date index');
    assert(claimSearchByFirstPart(results, ['FUNDS']), 'No funds');
    assert(claimSearchByFirstPart(results, ['STATE']), 'No state');
    assert(claimSearchByFirstPart(results, ['BEST_BY_QUOTE_INDEX', 'ACTIVE_INDEX']), 'No best by quote active index');
  };
};

export const testCreatePosition = () => {
  const privateKey = Buffer.from('31c70848e4e3aaffcf91f134853ec966e913aa9a813115bcb81512e7625f46a9', 'hex');
  const positionMaker = instances(dexAppContractName).find(
    (instance) => instance.alias === 'eth_offer_maker 0.0.9+devnet-blue',
  );

  const orderMaker = instances(marketMakerContractName).find(
    (instance) => instance.alias === 'bnb_pact_maker v0.0.10+devnet-blue',
  );

  if (!positionMaker) {
    throw new Error('positionMaker not found');
  }

  if (!orderMaker) {
    throw new Error('orderMaker not found');
  }

  const recipient = '0xf054B6Edd0f6801C66D1F103138f5E0672a65917';

  const createPosition = (): RoundInfo => {
    const self = constructContractIssuer(positionMaker.id);
    const quoteAmount = '0x00000000000000000000000000000000000000000000000000005af3107a4000';

    const withFunds: FundsForRound = { type: { privateKey } };

    return {
      txsInfo: {
        txs: [
          {
            callInfo: {
              ref: constructContractRef(self, []),
              methodInfo: {
                methodName: PUBLIC_METHODS.CREATE_POSITION,
                methodArgs: [quoteAmount, recipient, null],
              },
              contractArgs: [],
              contractInfo: {
                providedCweb: BigInt('0x00000000000000000000000000000000000000000000000579a814e10a7586a0'),
                authenticated: null,
              },
            },
            withFunds,
          },
        ],
        l1_events: [],
      },
      blocks_on: [],
      claims: [],
    };
  };

  const deposit = (): RoundInfo => {
    const self = constructContractIssuer(orderMaker.id);
    const depositAmount = '0x00000000000000000000000000000000000000000000000ad78ebc5ac6200000';

    const withFunds: FundsForRound = { type: { privateKey } };

    return {
      txsInfo: {
        txs: [
          {
            callInfo: {
              ref: constructContractRef(self, []),
              methodInfo: {
                methodName: 'DEPOSIT',
                methodArgs: [depositAmount],
              },
              contractArgs: [],
              contractInfo: {
                providedCweb: BigInt('0x00000000000000000000000000000000000000000000000ad78ebc5ac6202710'),
                authenticated: null,
              },
            },
            withFunds,
          },
        ],
        l1_events: [],
      },
      blocks_on: [],
      claims: [],
    };
  };

  const createOrder = (): RoundInfo => {
    const self = constructContractIssuer(orderMaker.id);
    const baseAmount = '0x000000000000000000000000000000000000000000000002b5e3af16b1880000';
    const l1Amount = '0x00000000000000000000000000000000000000000000000000038d7ea4c68000';
    const baseWallet = '03951f89fe78e13f295d96eb7afa1e0da726df7d58f9c84f7144e5febc30efeec4';

    const withFunds: FundsForRound = { type: { privateKey } };

    return {
      txsInfo: {
        txs: [
          {
            callInfo: {
              ref: constructContractRef(self, []),
              methodInfo: {
                methodName: 'CREATE_ORDER',
                methodArgs: [baseAmount, l1Amount, baseWallet],
              },
              contractArgs: [],
              contractInfo: {
                providedCweb: BigInt('0x0000000000000000000000000000000000000000000000000000000000004e20'),
                authenticated: null,
              },
            },
            withFunds,
          },
        ],
        l1_events: [],
      },
      claims: [],
      blocks_on: [],
    };
  };

  const takePosition = (positionId: string): RoundInfo => {
    const eventIssuer: ClaimIssuer = 'TransientBlockInfoProvider';
    const eventFirstPart = { l1_contract: '0x6e00389d89b8a85cac7f0891300e28020d868f52' };
    const eventSecondPart = {
      topics: [
        '0x5f7c9ad4d0773734853dba78fa92bd33af346833ce0b6310f7b1ceeb8a52ac3a',
        positionId,
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
    };

    const eventBody = {
      at_block: 1482,
      data: constructEvmEventForC1({
        amount: BigInt('0x000000000000000000000000000000000000000000000000000000000000000a'),
        nextContractId: orderMaker.id,
        nextContractMethod: '0x06',
        fallbackContractId: positionMaker.id,
        fallbackContractMethod: PUBLIC_METHODS.CREATE_POSITION,
        quoteAmount: BigInt('0x42768c0a913a'),
        quoteRecipient: '0xf054b6edd0f6801c66d1f103138f5e0672a65917',
        recipient,
      }),
      l1_txid: 'bb4b288c27679184316872231d4aec64138ce98a1a0aba838c9bf5f720c236c5',
      log_index: 0,
    };

    const event: IssuedClaim[] = [
      {
        issuer: eventIssuer,
        content: constructClaim(
          constructClaimKey(eventFirstPart, eventSecondPart),
          eventBody,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        ),
      },
    ];

    return {
      txsInfo: {
        txs: [],
        l1_events: [],
      },
      claims: [],
      blocks_on: [
        {
          issuer: constructContractIssuer('0x14f1e7f9cc269dc918b69d40d48a76a0cd51e575ca9fe56dce293d7ef87393b5'),
          content: constructClaim(
            constructClaimKey(constructContractIssuer(positionMaker.id), [
              'deva',
              {
                first: eventFirstPart,
                issuer: eventIssuer,
                second: eventSecondPart,
              },
            ]),
            event,
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          ),
        },
      ],
    };
  };

  it.skip('Test Create position', async () => {
    const input: ExecInfo = {
      rounds: [createPosition()],
    };

    const context: UnitTestContext = {
      name: 'Create Position flow',
      testPath: `./tests_data/${positionMaker.alias.split(' ')[0]}/createPosition`,
      options: {
        verbose: true,
      },
    };
    const test = new UnitTest(context);

    await test.load('./tests_data/state.json');

    return await test.run(input, validateCreation());
  });

  it('Test swap position', async () => {
    const initActions: ExecInfo = {
      rounds: [createPosition()],
    };

    const context: UnitTestContext = {
      name: 'Create Position + Expire flow',
      testPath: `./tests_data/${positionMaker.alias.split(' ')[0]}/swap`,
      options: {
        verbose: true,
      },
    };
    const test = new UnitTest(context);

    await test.load('./tests_data/state.json');
    await test.run(initActions, validateCreation());
    const positionIdOp = test.state.find((op) => {
      return isInsertedOp(op) && JSON.stringify(op.Insert.content.key.first_part) === JSON.stringify(['STATE']);
    });

    if (!positionIdOp || !isInsertedOp(positionIdOp)) {
      throw new Error('PositionId not found');
    }
    const positionId = (positionIdOp.Insert.content.key.second_part as string[])[0];
    const orderActions: ExecInfo = {
      rounds: [deposit(), createOrder()],
    };

    await test.run(orderActions);
    const takeActions: ExecInfo = {
      rounds: [takePosition(positionId)],
    };

    await test.run(takeActions);
    await test.finalize();
  });
};
