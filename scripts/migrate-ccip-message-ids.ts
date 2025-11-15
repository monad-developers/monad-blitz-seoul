import { createPublicClient, http, decodeEventLog } from 'viem';
import { sepolia } from '../src/lib/chains';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

// CCIP Router ABI - CCIPSendRequested 이벤트
const CCIP_ROUTER_ABI = [
  {
    name: 'CCIPSendRequested',
    type: 'event',
    inputs: [
      { name: 'message', type: 'tuple', components: [
        { name: 'receiver', type: 'bytes' },
        { name: 'data', type: 'bytes' },
        { name: 'tokenAmounts', type: 'tuple[]', components: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ]},
        { name: 'feeToken', type: 'address' },
        { name: 'extraArgs', type: 'bytes' }
      ], indexed: false },
      { name: 'destinationChainSelector', type: 'uint64', indexed: true },
      { name: 'messageId', type: 'bytes32', indexed: true },
      { name: 'gasLimit', type: 'uint256', indexed: false },
      { name: 'feeTokenAmount', type: 'uint256', indexed: false }
    ]
  }
] as const;

async function migrateMessageIds() {
  console.log('🚀 CCIP Message ID 마이그레이션 시작...\n');

  // Supabase 클라이언트 초기화
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  // Viem 클라이언트 초기화 (Sepolia)
  const viemClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.gateway.tenderly.co')
  });

  try {
    // 1. 데이터베이스에서 모든 ccip_attestations 레코드 조회
    console.log('📋 데이터베이스에서 모든 CCIP attestations 조회 중...');
    const { data: attestations, error: fetchError } = await supabase
      .from('ccip_attestations')
      .select('*');

    if (fetchError) {
      console.error('❌ 데이터베이스 조회 실패:', fetchError.message);
      process.exit(1);
    }

    if (!attestations || attestations.length === 0) {
      console.log('✅ 마이그레이션할 레코드가 없습니다.');
      process.exit(0);
    }

    console.log(`✅ ${attestations.length}개의 레코드를 찾았습니다.\n`);

    // 2. 각 레코드의 messageId를 검증하고 필요시 업데이트
    let updatedCount = 0;
    let skippedCount = 0;

    for (const attestation of attestations) {
      const { id, sepolia_tx_hash, ccip_message_id } = attestation;

      console.log(`\n🔍 레코드 ID: ${id}`);
      console.log(`   TX Hash: ${sepolia_tx_hash}`);
      console.log(`   Current Message ID: ${ccip_message_id}`);

      // messageId가 이미 올바른 형식인지 확인 (0x로 시작하고 64자 = 32바이트)
      if (ccip_message_id && ccip_message_id.startsWith('0x') && ccip_message_id.length === 66) {
        // 실제로 트랜잭션 해시인지 확인 (tx hash도 같은 형식)
        // 트랜잭션 receipt에서 CCIP messageId를 추출해서 비교
        try {
          const receipt = await viemClient.getTransactionReceipt({
            hash: sepolia_tx_hash as `0x${string}`
          });

          if (!receipt) {
            console.log(`   ⚠️  트랜잭션을 찾을 수 없습니다. (RPC 지연 또는 삭제된 트랜잭션)`);
            skippedCount++;
            continue;
          }

          // CCIPSendRequested 이벤트에서 messageId 추출
          let extractedMessageId: string | null = null;

          if (receipt.logs) {
            for (const log of receipt.logs) {
              try {
                const decoded = decodeEventLog({
                  abi: CCIP_ROUTER_ABI,
                  data: log.data,
                  topics: log.topics
                });

                if (decoded.eventName === 'CCIPSendRequested') {
                  extractedMessageId = decoded.args.messageId as string;
                  break;
                }
              } catch {
                // 다른 이벤트, 계속 진행
              }
            }
          }

          if (extractedMessageId && extractedMessageId !== ccip_message_id) {
            console.log(`   ✅ 실제 CCIP Message ID: ${extractedMessageId}`);
            console.log(`   🔄 데이터베이스 업데이트 중...`);

            const { error: updateError } = await supabase
              .from('ccip_attestations')
              .update({ ccip_message_id: extractedMessageId })
              .eq('id', id);

            if (updateError) {
              console.log(`   ❌ 업데이트 실패: ${updateError.message}`);
              skippedCount++;
            } else {
              console.log(`   ✅ 업데이트 완료!`);
              updatedCount++;
            }
          } else if (!extractedMessageId) {
            console.log(`   ⚠️  CCIPSent 이벤트를 찾을 수 없습니다.`);
            skippedCount++;
          } else {
            console.log(`   ℹ️  이미 올바른 messageId입니다.`);
            skippedCount++;
          }
        } catch (error) {
          console.log(`   ❌ 트랜잭션 조회 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
          skippedCount++;
        }
      } else {
        console.log(`   ⚠️  messageId 형식이 올바르지 않습니다.`);
        skippedCount++;
      }
    }

    // 3. 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 마이그레이션 완료!');
    console.log(`   ✅ 업데이트됨: ${updatedCount}개`);
    console.log(`   ⏭️  건너뜀: ${skippedCount}개`);
    console.log(`   📝 총: ${updatedCount + skippedCount}개`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
    process.exit(1);
  }
}

migrateMessageIds();
