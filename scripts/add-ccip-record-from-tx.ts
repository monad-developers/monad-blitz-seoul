import { createPublicClient, http, decodeEventLog, decodeAbiParameters, parseAbiParameters } from 'viem';
import { sepolia } from '../src/lib/chains';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

// Verifier 컨트랙트 ABI
const VERIFIER_ABI = [
  {
    name: 'AttestationCreated',
    type: 'event',
    inputs: [
      { name: 'attestationId', type: 'bytes32', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'nftContract', type: 'address', indexed: false },
      { name: 'tokenId', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'AttestationBridged',
    type: 'event',
    inputs: [
      { name: 'attestationId', type: 'bytes32', indexed: true },
      { name: 'destinationChain', type: 'uint64', indexed: true },
      { name: 'receiver', type: 'address', indexed: false },
      { name: 'messageId', type: 'bytes32', indexed: false }
    ]
  }
] as const;

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

// Verifier ABI - bridgeAttestation 함수
const VERIFIER_BRIDGE_ABI = [
  {
    name: 'bridgeAttestation',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'attestationId', type: 'bytes32' },
      { name: 'destinationChainSelector', type: 'uint64' },
      { name: 'receiver', type: 'address' }
    ]
  }
] as const;

// 사용자 입력 받기
function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function addCCIPRecord() {
  console.log('🚀 CCIP 레코드 추가 (트랜잭션 해시로부터)\n');

  // 트랜잭션 해시 입력받기
  const txHash = await askQuestion('📝 Sepolia 트랜잭션 해시를 입력하세요: ');

  if (!txHash.startsWith('0x') || txHash.length !== 66) {
    console.error('❌ 유효한 트랜잭션 해시가 아닙니다. (0x로 시작, 64자 이상)');
    process.exit(1);
  }

  // Supabase 클라이언트 초기화
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  // Viem 클라이언트 초기화
  const viemClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.gateway.tenderly.co')
  });

  try {
    console.log('\n🔍 트랜잭션 조회 중...');

    // 트랜잭션 조회
    const tx = await viemClient.getTransaction({
      hash: txHash as `0x${string}`
    });

    if (!tx) {
      console.error('❌ 트랜잭션을 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('✅ 트랜잭션 found');
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);

    // Receipt 조회
    console.log('\n📋 Receipt 조회 중...');
    const receipt = await viemClient.getTransactionReceipt({
      hash: txHash as `0x${string}`
    });

    if (!receipt) {
      console.error('❌ Receipt을 찾을 수 없습니다.');
      process.exit(1);
    }

    // 이벤트 추출
    let attestationId: string | null = null;
    let ccipMessageId: string | null = null;
    let receiver: string | null = null;
    let nftContract: string | null = null;
    let tokenId: string | null = null;

    if (receipt.logs) {
      for (const log of receipt.logs) {
        try {
          // AttestationCreated 이벤트 확인
          try {
            const decoded = decodeEventLog({
              abi: VERIFIER_ABI,
              data: log.data,
              topics: log.topics
            });

            if (decoded.eventName === 'AttestationCreated') {
              attestationId = decoded.args.attestationId as string;
              nftContract = decoded.args.nftContract as string;
              tokenId = decoded.args.tokenId?.toString();
              console.log('✅ AttestationCreated 이벤트 found');
              console.log(`   Attestation ID: ${attestationId}`);
              console.log(`   NFT Contract: ${nftContract}`);
              console.log(`   Token ID: ${tokenId}`);
            }

            if (decoded.eventName === 'AttestationBridged') {
              attestationId = decoded.args.attestationId as string;
              ccipMessageId = decoded.args.messageId as string;
              receiver = decoded.args.receiver as string;
              console.log('✅ AttestationBridged 이벤트 found');
              console.log(`   Attestation ID: ${attestationId}`);
              console.log(`   Message ID: ${ccipMessageId}`);
              console.log(`   Receiver: ${receiver}`);
            }
          } catch {
            // Verifier 이벤트 아님, CCIP Router 이벤트 확인
            try {
              const decoded = decodeEventLog({
                abi: CCIP_ROUTER_ABI,
                data: log.data,
                topics: log.topics
              });

              if (decoded.eventName === 'CCIPSendRequested') {
                ccipMessageId = decoded.args.messageId as string;
                console.log('✅ CCIPSendRequested 이벤트 found (CCIP Router)');
                console.log(`   Message ID: ${ccipMessageId}`);
              }
            } catch {
              // 다른 이벤트
            }
          }
        } catch {
          // 계속 진행
        }
      }
    }

    // 이벤트 결과 확인
    if (attestationId && !ccipMessageId) {
      console.warn('\n⚠️  AttestationCreated만 found됨');
      console.warn('    💡 bridgeAttestation() 함수가 아직 호출되지 않았습니다.');
      console.warn('    💡 다음 단계: bridgeAttestation()을 호출해서 CCIP로 전송하세요.\n');
      process.exit(0);
    } else if (!attestationId) {
      console.error('\n❌ 이 트랜잭션에서 Attestation 관련 이벤트를 찾을 수 없습니다.');
      console.error('   correctVerifier 컨트랙트가 호출되었는지 확인하세요.\n');
      process.exit(1);
    }

    if (!ccipMessageId) {
      console.warn('⚠️  CCIPSendRequested 이벤트를 찾을 수 없습니다. (트랜잭션 실패 또는 진행중)');
      ccipMessageId = await askQuestion('💬 CCIP Message ID를 수동으로 입력하세요: ');
    }

    // 이벤트에서 추출하지 못한 경우 함수 input에서 추출
    if (!attestationId && tx.input && tx.input !== '0x') {
      try {
        // 함수 selector (4 bytes) 다음부터 파싱
        const inputData = tx.input;
        // bridgeAttestation의 첫 번째 파라미터 (attestationId)는 32 bytes
        attestationId = '0x' + inputData.slice(10, 10 + 64);
        console.log('\n✅ Attestation ID extracted from input');
        console.log(`   Attestation ID: ${attestationId}`);
      } catch (err) {
        console.warn('⚠️  Attestation ID를 자동 추출할 수 없습니다.');
      }
    }

    if (!attestationId || attestationId === '0x') {
      attestationId = await askQuestion('\n💬 Attestation ID를 입력하세요: ');
    }

    // NFT Contract와 TokenId가 이벤트에서 추출되지 않은 경우
    if (!nftContract) {
      nftContract = (await askQuestion('\n💬 Sepolia NFT Contract Address: ')).toLowerCase();
    }

    if (!tokenId) {
      tokenId = await askQuestion('💬 Sepolia Token ID: ');
    }

    // Monad Address (트랜잭션 from 주소 사용)
    const monadAddress = tx.from?.toLowerCase() || (await askQuestion('\n💬 Monad Address: ')).toLowerCase();

    // 검증
    if (!monadAddress.startsWith('0x') || monadAddress.length !== 42) {
      console.error('❌ 유효한 주소가 아닙니다.');
      process.exit(1);
    }

    if (!nftContract.startsWith('0x') || nftContract.length !== 42) {
      console.error('❌ 유효한 NFT 컨트랙트 주소가 아닙니다.');
      process.exit(1);
    }

    // 요약 표시
    console.log('\n' + '='.repeat(60));
    console.log('📊 추가할 레코드 요약:');
    console.log('='.repeat(60));
    console.log(`Monad Address: ${monadAddress}`);
    console.log(`Sepolia NFT Contract: ${nftContract}`);
    console.log(`Sepolia Token ID: ${tokenId}`);
    console.log(`CCIP Message ID: ${ccipMessageId}`);
    console.log(`Attestation ID: ${attestationId}`);
    console.log(`Sepolia TX Hash: ${txHash}`);
    console.log('='.repeat(60));

    // 확인
    const confirm = await askQuestion('\n✅ 이 정보로 DB에 추가하시겠습니까? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ 취소되었습니다.');
      process.exit(0);
    }

    // DB에 추가
    console.log('\n💾 데이터베이스에 추가 중...');

    const { data, error } = await supabase
      .from('ccip_attestations')
      .insert({
        monad_address: monadAddress,
        sepolia_nft_address: nftContract,
        sepolia_token_id: tokenId,
        ccip_message_id: ccipMessageId,
        attestation_id: attestationId,
        sepolia_tx_hash: txHash,
        source_chain_selector: '16015286601757825753', // Sepolia
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        used: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ DB 추가 실패:', error.message);
      process.exit(1);
    }

    console.log('\n✅ 레코드가 성공적으로 추가되었습니다!');
    console.log(`📌 Record ID: ${data?.id}`);
    console.log(`\n🔗 모니터링 URL: http://localhost:3000/api/ccip/monitor/${ccipMessageId}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
    process.exit(1);
  }
}

addCCIPRecord();
