import { vi } from 'vitest';
import { parseL1EventClaimBody } from '.';
import { btcOutputToAddress } from './dataConversion';
import { L1Types } from '../types';

vi.mock('std', () => ({
  open: vi.fn(),
}));

vi.mock('./contract', async (importOriginal) => {
 const actual = await importOriginal() as Record<string, unknown>;
 return {
   ...actual,
   getInstanceParameters: vi.fn((l1Type?: L1Types) => {
       if (l1Type === L1Types.Evm) {
         return { shard: 'ethereum', l1_type: L1Types.Evm, l1_contract_address: '0x1234567890123456789012345678901234567890' };
       } else {
         return { shard: 'btc', l1_type: L1Types.Btc };
       }
     }),
 };
});



describe('processEventClaim', () => {
   describe('parseL1EventClaimBody', () => {

     // Second last output from:
     // https://mempool.space/tx/1c087af7eaa5395b2a2fe3743e18c85b409468f747705d69bcb8d19c9b689ade?mode=details
     it('should parse another BTC P2SH address', () => {
       const asm = "OP_HASH160 fa669b4cf34a824120f286273b93c11692dc490f OP_EQUAL";
       
       vi.mock('./contract', async (importOriginal) => {
        const actual = await importOriginal() as Record<string, unknown>;
        return {
          ...actual,
          getInstanceParameters: vi.fn((l1Type?: L1Types) => {
                return { shard: 'btc', l1_type: L1Types.Btc };
            }),
        };
       });

       const outputHash = asm.split(' ')[1];

       const walletBtc = btcOutputToAddress(outputHash);

       expect(walletBtc).toEqual("3QX1mjdo9329EFVdmQSarAHb7zfxS4S3hK");
     });


     it('should parse BTC event claim body correctly', () => {
       const btcEventClaimBody = {
         UtxoBased: {
           txid: "33294e79374339cd2d4588e78979ab9deb26894199d5d5fd2dbbc2c9a9011359",
           vin: [
             {
               scriptSig: {
                 hex: "160014c62e47f4aecd192e074e12f1617f753adc214134"
               },
               txid: "2b62a47ffe4f0645db2a852dbfcce834f6dae68ea7fa646b7bdf7dd7ca7361b0",
               vout: 3
             },
             {
               scriptSig: {
                 hex: "16001409f99d74fe645d78ccf531baaf6d92c852f282e7"
               },
               txid: "9f7fd4c2a37da92f4d9cf6f37b63f5964b9986cc5ed7f535e1d4bfeb77fc27c7",
               vout: 0
             }
           ],
           vout: [
             {
               scriptPubKey: {
                 asm: "OP_HASH160 6bbf86fe0bb9d879108f1280466470c869c5937f OP_EQUAL"
               },
               value: 0.0000424
             },
             {
               scriptPubKey: {
                 asm: "2 0303810d65afc26c3ce3082888a09e116ec1eecf4ce8fe5c374d15bd546f3b3f40 030013ef65020bfc97826ff7243b6f1ce72897cfc7ffb8a7a7e65ccde3cef2d2a1 03002306409731883ca6815ff595f78a98992e94660dc7d7c338297ede375a7250 3 OP_CHECKMULTISIG"
               },
               value: 0.000008
             },
             {
               scriptPubKey: {
                 asm: "2 03015436a0a301ff00000000000000000000000000000000000000000000000000 030500000000000000000000000000000000000000000000000000000000000000 030500000000000000000000000000000000000000000000000000000000000000 3 OP_CHECKMULTISIG"
               },
               value: 0.000008
             },
             {
               scriptPubKey: {
                 asm: "OP_HASH160 6bbf86fe0bb9d879108f1280466470c869c5937f OP_EQUAL"
               },
               value: 0.00007
             },
             {
               scriptPubKey: {
                 asm: "OP_HASH160 59d8e889afa4b88e331a24c8b4a60fa520a3655a OP_EQUAL"
               },
               value: 0.00010984
             }
           ]
         }
       };

       const expectedBtcEventData = {
         callType: 129,
         fallbackContractId: '0x9731883ca6815ff595f78a98992e94660dc7d7c338297ede375a72505436a0a3',
         fallbackContractMethod: '0x01',
         nextContractId: '0x13ef65020bfc97826ff7243b6f1ce72897cfc7ffb8a7a7e65ccde3cef2d2a123',
         nextContractMethod: '0x06',
         paidAmount: '0x0000000000000000000000000000000000000000000000000000000000001b57',
         quoteAmount: '0x65afc26c3ce30',
         quoteRecipient: '0x88a09e116ec1eecf4ce8fe5c374d15bd546f3b3f',
         recipient: '3BWjfcxDKpm47iNRrdC7hU6HNW9sdTRbZ1',
       };

       const parsedBtcEventData = parseL1EventClaimBody(btcEventClaimBody);
       expect(parsedBtcEventData).toEqual(expectedBtcEventData);
     });

     // Second last output from:
     // https://mempool.space/tx/1c087af7eaa5395b2a2fe3743e18c85b409468f747705d69bcb8d19c9b689ade?mode=details
     it('should parse another BTC event claim body correctly', () => {
       const btcEventClaimBody = {
         UtxoBased: {
           txid: "1c087af7eaa5395b2a2fe3743e18c85b409468f747705d69bcb8d19c9b689ade",
           vin: [
             {
               scriptSig: {
                 hex: "160014218cd18f2f96735dab3fb823f8d2764b6de5d581"
               },
               txid: "7569c54f2ae6d0eca0dee7df931cae99ec3d23c3cb95e77b1ca1375dec0fcc6b",
               vout: 3
             },
             {
               scriptSig: {
                 hex: "160014c88753f2f9ebd0ce121111104ad16ff1987ef80b"
               },
               txid: "7569c54f2ae6d0eca0dee7df931cae99ec3d23c3cb95e77b1ca1375dec0fcc6b",
               vout: 4
             }
           ],
           vout: [
             {
               scriptPubKey: {
                 asm: "OP_HASH160 fa669b4cf34a824120f286273b93c11692dc490f OP_EQUAL"
               },
               value: 0.00005
             },
             {
               scriptPubKey: {
                 asm: "2 0301810d5728efca7d55052888a09e116ec1eecf4ce8fe5c374d15bd546f3b3f40 030013ef65020bfc97826ff7243b6f1ce72897cfc7ffb8a7a7e65ccde3cef2d2a1 03002306409731883ca6815ff595f78a98992e94660dc7d7c338297ede375a7250 3 OP_CHECKMULTISIG"
               },
               value: 0.000008
             },
             {
               scriptPubKey: {
                 asm: "2 03015436a0a301ff00000000000000000000000000000000000000000000000000 030500000000000000000000000000000000000000000000000000000000000000 030500000000000000000000000000000000000000000000000000000000000000 3 OP_CHECKMULTISIG"
               },
               value: 0.000008
             },
             {
               scriptPubKey: {
                 asm: "OP_HASH160 fa669b4cf34a824120f286273b93c11692dc490f OP_EQUAL"
               },
               value: 0.00006
             },
             {
               scriptPubKey: {
                 asm: "OP_HASH160 d652c36849f5ce9ac723fe06cd80c5c85f2d8971 OP_EQUAL"
               },
               value: 0.00011506
             }
           ]
         }
       };

       const expectedBtcEventData = {
         callType: 129,
         fallbackContractId: '0x9731883ca6815ff595f78a98992e94660dc7d7c338297ede375a72505436a0a3',
         fallbackContractMethod: '0x01',
         nextContractId: '0x13ef65020bfc97826ff7243b6f1ce72897cfc7ffb8a7a7e65ccde3cef2d2a123',
         nextContractMethod: '0x06',
         paidAmount: '0x0000000000000000000000000000000000000000000000000000000000001770',
         quoteAmount: '0x5728efca7d550',
         quoteRecipient: '0x88a09e116ec1eecf4ce8fe5c374d15bd546f3b3f',
         recipient: '3QX1mjdo9329EFVdmQSarAHb7zfxS4S3hK',
       };

       const parsedBtcEventData = parseL1EventClaimBody(btcEventClaimBody);
       expect(parsedBtcEventData).toEqual(expectedBtcEventData);
     });

   });
});
